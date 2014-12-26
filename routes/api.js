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


//
// Meteorologia
//

var cacheTempo = {};

/*
{
    "9b74c9897bac770ffc029102a200c5de": {
        "condicoes": {},
        "timestamp": xxx
    }

}
*/

var CACHE_PERIOD = 20 * 60 // 20 minutos

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

    if(cacheTempo.hasOwnProperty(hash)){
        if(curTimestamp() - cacheTempo[hash].timestamp < CACHE_PERIOD)
            return res.send({error: null, status: "OK", data: cacheTempo[hash].condicoes});
        else{
            queryWeatherAPI({local: local, gps: coords}, function(err, data){
                if(err){
                    console.error(err);
                    return res.send({error: "Algo aconteceu...", status: "error", data: null});
                }
                cacheTempo[hash] = {};

                cacheTempo[hash].timestamp = curTimestamp();
                cacheTempo[hash].condicoes = data;
                return res.send({error: null, status: "OK", data: cacheTempo[hash].condicoes});
            });
        } 

    }
    else{

        queryWeatherAPI({local: local, gps: coords}, function(err, data){
            if(err){
                console.error(err);
                return res.send({error: "Algo aconteceu...", status: "error", data: null});
            }

            if(data){
                cacheTempo[hash] = {};

                cacheTempo[hash].timestamp = curTimestamp();
                cacheTempo[hash].condicoes = data;
                return res.send({error: null, status: "OK", data: cacheTempo[hash].condicoes});
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
        gmaputil.geocoding(options.local.trim().replace(/ /g,"+"), null, function(err, result) {
            if (err) {
                console.error(err);
                return callback(err, null);
            }

            result = JSON.parse(result);
            
            if(result.status == "OK"){
                var coords = result.results[0].geometry.location;
                forecastIOAPI([result.results[0].geometry.location.lat, result.results[0].geometry.location.lng], function(err, data){
                    callback(err,data);
                });
            }
            else
                callback(result.status, null);

        });
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

        callback(err, { vento: {velocidade: data.currently.windSpeed, direccao: data.currently.windBearing},
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
