/**
 * Created by André on 22/10/2014.
 */
var express = require('express');
var router = express.Router();
var PontoTuristico = require('../models/PontoTuristico');
var Rota = require('../models/Rota');

var forecastIo = new (require('forecastio'))('6a374d9d6fafc0e653bbcd3aecef7e39', {timeout: 10*1000});
var gmaputil = require('googlemapsutil');
gmaputil.setOutput('json');
var crypto = require('crypto');
var MemCache = require('mem-cache');
var mongoose = require("mongoose");



router.get('/ponto/:id', function(req, res) {
    PontoTuristico.findById(req.params.id)
        .exec(function (err, ponto) {
            if(err)
                res.send({status: "error", err: err});
            else
                if(ponto)
                    res.json({status: "OK", data: ponto});
                else
                    res.json({status: "OK", data: null});
        });
});

router.get('/distrito/:nome', function(req, res) {
    PontoTuristico.find({distrito: req.params.nome})
        .exec(function (err, pontos) {
            if(err)
                res.send({status: "error", err: err});
            else
            if(pontos)
                res.json({status: "OK", data: pontos});
            else
                res.json({status: "OK", data: null});
        });
});

router.get('/pesquisar', function(req, res) {
    var query = req.query.texto;

    PontoTuristico.find(
            { $text : { $search : query } },
            { score : { $meta: "textScore" } })
        .sort({ score : { $meta : 'textScore' } })
        .limit(10)
        .select("-igogo -descricao")
        .exec(function(err, results) {
            if(err)
                res.send({status: "error", err: err});
            else
            if(results) {

                res.send({status: "OK", data: results});
                //res.json(results);
            }else {
                res.json({status: "OK", data: null});
            }
        });
});







router.get('/direccoes', function(req, res) {
    var origem = req.query.origem;
    var destino = req.query.destino;
    // waypoints = mongoid1,mongoid2,...
    var waypoints = req.query.waypoints;

    var ids = [];
    if(mongoose.Types.ObjectId.isValid(origem))
        ids.push(mongoose.Types.ObjectId(origem));
    else
        return res.send({error: "Ponto de origem inválido. Apenas IDs", status: "ERROR", data: null});

    if(mongoose.Types.ObjectId.isValid(destino))
        ids.push(mongoose.Types.ObjectId(destino));
    else
        return res.send({error: "Destino inválido. Apenas IDs", status: "ERROR", data: null});

    waypoints.split(",").forEach(function(id){
        if(mongoose.Types.ObjectId.isValid(id))
            ids.push(mongoose.Types.ObjectId(id));
    });

    PontoTuristico.find({"_id": { $in : ids } })
        .select("localizacao.gps")
        .exec(function(err, data){
            var stringCoords = "";
            var coords_origem, coords_destino;
            var final_waypoints = [];
            data.forEach(function(ponto){

                if(ponto._id != origem && ponto._id != destino){
                    stringCoords += ponto.localizacao.gps[0] + "," + ponto.localizacao.gps[1] + "|";
                    final_waypoints.push({id: ponto._id, coords: ponto.localizacao.gps});
                }

                if(ponto._id == origem)
                    coords_origem = ponto.localizacao.gps;

                if(ponto._id == destino)
                    coords_destino = ponto.localizacao.gps;
            });

            stringCoords = stringCoords.substr(0, stringCoords.length - 1);
        

            gmaputil.directions(coords_origem[0]+","+coords_origem[1], coords_destino[0]+","+coords_destino[1], {key: "AIzaSyCwdktJFazbeyPfWweFW_laQMLRqiXxeSg",waypoints: "optimize:true|" + stringCoords}, function(err, data){
                if (err) {
                    console.error(err);
                    return res.send({error: err, status: "error", data: null});
                }

                var result = JSON.parse(data);

                if(result.status == "OK"){
                    var out = {error: null,
                        status: "OK",
                        data: {
                            origem: {id: ids[0], coords: coords_origem},
                            destino: {id: ids[1], coords: coords_destino},
                            waypoints: final_waypoints,
                            ordem_waypoints: result.routes[0].waypoint_order,
                            polyline: result.routes[0].overview_polyline.points
                        }
                    };

                    return res.send(out);


                }
                else
                    return res.send({error: result.status, status: "error", data: null});
                
            }, null, true);

        });
});









//
////// Meteorologia
//

var CACHE_PERIOD = 20 * 60 // 20 minutos
var cacheTempo = new MemCache({timeout: CACHE_PERIOD * 1000});


router.get('/tempo', function(req, res) {
    var md5sum = crypto.createHash('md5');
    var local = req.query.local;
    var gps = req.query.gps;
    var coords = null;
    var hash;


    if(local && local.length > 50){
        return res.send({error: "Nome de local demasido extenso", status: "error", data: null});
    }

    if(local){
        hash = md5sum.update(local).digest('hex');
    }
    else if(gps){
        coords = gps.split(",");
        if(isNaN(parseFloat(coords[0])) && isNaN(parseFloat(coords[1]))){
            return res.send({error: "Coordenadas GPS inválidas", status: "error", data: null});
        }
        else{
            hash = md5sum.update(gps).digest('hex');
            coords = [parseFloat(coords[0]), parseFloat(coords[1])];
        }
    }

    var dados = cacheTempo.get(hash);

    if(dados){
        return res.send({error: null, status: "OK", data: dados});
    }
    else{

        queryWeatherAPI({local: local, gps: coords}, function(err, data){
            if(err){
                console.error(err);
                return res.send({error: err, status: "error", data: null});
            }

            if(data){

                cacheTempo.set(hash, data);
                return res.send({error: null, status: "OK", data: data});
            }

            return res.send({error: null, status: "NO_DATA", data: null});
        });
    }

});

// options = {local: "", gps: []}
var iooptions = {
    units: 'si',
    exclude: 'hourly,flags,daily'
};
function queryWeatherAPI(options, callback){
    if(options.local){
        gmaputil.geocoding(options.local.trim().replace(/ /g,"+"), {key: "AIzaSyCwdktJFazbeyPfWweFW_laQMLRqiXxeSg"}, function(err, result) {
            if (err) {
                console.error(err);
                return callback(err, null);
            }

            result = JSON.parse(result);
            
            if(result.status == "OK"){
                var coords = result.results[0].geometry.location;
                forecastIOAPI([result.results[0].geometry.location.lat, result.results[0].geometry.location.lng], function(err, data){
                    data.localizacao.endereco = result.results[0].formatted_address;
                    callback(err, data);
                });
            }
            else
                callback(result.status, null);

        }, null, true);
    }
    else if(options.gps){
        forecastIOAPI([options.gps[0], options.gps[1]], function(err, data){
            callback(err,data);
        });
    }
}

var Wicons = {
    "rain": "wi-rain",
    "snow": "wi-snow",
    "sleet": "wi-sleet",
    "hail": "wi-hail",
    "wind": "wi-windy",
    "fog": "wi-fog",
    "cloudy": "wi-cloudy",
    "partly-cloudy-day": "wi-day-cloudy",
    "partly-cloudy-night": "night-partly-cloudy",
    "clear-day": "wi-day-sunny",
    "clear-night": "wi-night-clear"
}

function forecastIOAPI(gps, callback){
    forecastIo.forecast(gps[0], gps[1], iooptions, function(err, data) {
        if (err)
            console.error(err);

        callback(err, { localizacao: {coordenadas: [gps[0], gps[1]]},
                        vento: {velocidade: data.currently.windSpeed, direccao: data.currently.windBearing},
                        humidade: data.currently.humidity,
                        temperatura: data.currently.temperature,
                        temperaturaAparente: data.currently.apparentTemperature,
                        precipitacao: {intensidade: data.currently.precipIntensity, probabilidade: data.currently.precipProbability},
                        cobertura: data.currently.cloudCover,
                        pressaoAtmosferica: data.currently.pressure,
                        sumario: data.currently.summary,
                        icon: Wicons[data.currently.icon]
                    }
        );
    });
}

function curTimestamp(){
    return Date.now() / 1000 | 0;
}

module.exports = router;
