/**
 * Created by André on 13/10/2014.
 */

var mongoose = require('mongoose');

var ponto = mongoose.Schema({

    nome: 	    String,
    tipo:	    {type: String, index: true },

    descricao:  String,

    localizacao: {
        distrito:   {type: String, index: true },
        cidade:     {type: String, index: true },
        gps:        { type: {lat: Number, lng: Number}, index: '2dsphere'},
        morada:	    String
    },

    referencias: {
        igogo:      String,
        foursquare: String
    },
    

    url:        {type: String, index: { unique: true } },

    // restaurantes
    cozinha:    {type: String, index: true }
});

module.exports = mongoose.model('PontoTuristico', ponto, 'pontosturisticos');