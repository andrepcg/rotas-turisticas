/**
 * Created by André on 13/10/2014.
 */

var mongoose = require('mongoose');

var ponto = mongoose.Schema({

    nome: 	    String,
    tipo:	    {type: String, index: true },
    morada:	    String,
    descricao:  String,
    distrito:   {type: String, index: true },
    cidade:     {type: String, index: true },
    gps:        { type: {lat: Number, lng: Number}, index: '2dsphere'},
    igogo:      String,
    url:        {type: String, index: true }
});

module.exports = mongoose.model('PontoTuristico', ponto, 'pontosturisticos');