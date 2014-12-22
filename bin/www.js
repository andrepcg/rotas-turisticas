
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

var user_agent = "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.153 Safari/537.36";

var http = require("http");
var zlib = require('zlib');

function getGzipped(url, callback) {
    // buffer to store the streamed decompression
    var buffer = [];

    http.get(url, function(res) {
        // pipe the response into the gunzip to decompress
        var gunzip = zlib.createGunzip();
        res.pipe(gunzip);

        gunzip.on('data', function(data) {
            // decompression chunk ready, add it to the buffer
            buffer.push(data.toString())

        }).on("end", function() {
            // response and decompression complete, join the buffer and return
            callback(null, buffer.join(""));

        }).on("error", function(e) {
            callback(e);
        })
    }).on('error', function(e) {
        callback(e)
    });
}

var processUrl = function(link, callback){

    getGzipped(link, function(error, data) {

        $ = cheerio.load(data);

        //var distrito = $("#breadcrumbs a").slice(1,2).text();
        //arr = distrito.split(' '),
        //result = arr.splice(0,2);
        //result.push(arr.join(' '));


        var ponto = new PontoTuristico({
            nome: $("#layout_title").text(),
            igogo: link,
            tipo: $("#breadcrumbs a").slice(4,5).text(),
            morada: $(".address_value").text().trim(),
            distrito: $("#breadcrumbs a").slice(2,3).text(),
            cidade: $("#breadcrumbs a").slice(2,3).text(),
            descricao: $("#poi_description_text").text(),
            //cozinha: $("#breadcrumbs a").slice(4,5).text()
        });

        ponto.url = utils.urlSlug(ponto.nome);

        ponto.save(function(err){
            if(err){

                //duplicado
                if(err.code === 11000){
                    PontoTuristico.count({"igogo": ponto.igogo}).exec(function(err,count){
                        if(count == 0){
                            ponto.url += "-"+ponto._id.toString().substr(18);
                            ponto.save(function(err){if(err) console.error(err)});
                        }
                    });
                }
                else
                    console.error(err)
            }

        });
        //console.log(ponto);
        callback();

    });

}

for(var i = 1; i <= 6; i++){
    request({uri: encodeURI("http://www.igogo.pt/espacos-culturais-coimbra/?page="+i), maxRedirects:1, headers: {'User-Agent': user_agent}, encoding: null, jar: request.jar() }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            $ = cheerio.load(body);

            var urls = $("li.poi .content a");

            var links = [];
            urls.each(function(i, link){
                links.push("http://www.igogo.pt" + $(link).attr('href'));
            });

            async.eachLimit(links, 5, processUrl);
        }
    });
}
