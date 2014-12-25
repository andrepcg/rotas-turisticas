
var debug = require('debug')('Rotas-Turisticas');
var app = require('../app');
var utils = require("../utils");

var request = require('request');
var async = require("async");
var cheerio = require('cheerio');

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function() {
  debug('Express server listening on port ' + server.address().port);
});

require("mongoose").connect("mongodb://andrepcg:dhji483hf849823bvngf@ds041380.mongolab.com:41380/rotas");
var PontoTuristico = require("../models/PontoTuristico");

var gmaputil = require('googlemapsutil');


/*
var geocode = function(rua,cb){

    gmaputil.geocoding(rua, null, function(err, result) {

        if (err) {
            console.error(err);
            cb(null);
        } else {
            var json = JSON.parse(result);
            if(json.status == "OK") {
                cb(json.results[0].geometry.location);
            }else
                cb(null);


        }

    });
}

var f = function(ponto){
    geocode(ponto.morada.trim().replace(/ /g,"+") + "+Portugal", function(loc){

        if(loc) {
            console.log(2, loc);

            ponto.gps = loc;
            ponto.save(function(err){
                if(err) console.error(err);
            });
        }
    });


}

PontoTuristico.find({ gps: { $exists: false} }).exec(function(err, pontos){
    if(err)
        console.error(err);

    if(pontos){
        (function theLoop (i) {
            setTimeout(function () {

                for(var z = 0; z < 5 && i >= 0; z++)
                    f(pontos[i--]);

                if (i) {
                    theLoop(i);
                }
            }, 5500);
        })(pontos.length - 1);

    }

});
*/
