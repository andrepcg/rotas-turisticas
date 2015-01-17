/**
 * Created by André on 13/10/2014.
 */

var mongoose = require('mongoose');
var utils = require("../utils");

var ponto = mongoose.Schema({

    nome: 	    String,
    tipo:	    {type: String, index: true },

    descricao:  String,

    localizacao: {
        distrito:   {type: String, index: true },
        cidade:     {type: String, index: true },
        pais:       {type: String, index: true },
        gps:        { type: [Number], index: '2dsphere'},
        morada:	    String
    },

    referencias: {
        igogo:      String,
        foursquare: String
    },
    

    url:        {type: String},

    // restaurantes
    cozinha:    {type: String, index: true }
});

ponto.pre('save', function(next) {
    this.url = utils.urlSlug(this.nome);
    next();
});

module.exports = mongoose.model('PontoTuristico', ponto, 'pontosturisticos');