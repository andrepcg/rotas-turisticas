
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

        var distrito = $("#breadcrumbs a").slice(1,2).text(),
            arr = distrito.split(' '),
            result = arr.splice(0,2);
        result.push(arr.join(' '));


        var ponto = new PontoTuristico({
            nome: $("#layout_title").text(),
            igogo: link,
            tipo: $("#breadcrumbs a").slice(4).text(),
            morada: $(".address_value").text(),
            distrito: result[2],
            descricao: $("#poi_description_text").text()
        });

        ponto.save(function(err){
            if(err)
                console.log(err);
        });
        //console.log(ponto);
        callback();

    });

}

for(var i = 1; i <= 33; i++){
    request({uri: encodeURI("http://www.igogo.pt/pontos-turisticos-Coimbra/?page="+i), maxRedirects:1, headers: {'User-Agent': user_agent}, encoding: null, jar: request.jar() }, function (error, response, body) {
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
/**
 * Created by André on 13/10/2014.
 */
