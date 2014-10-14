/**
 * Created by André on 13/10/2014.
 */

var mongoose = require('mongoose');

var ponto = mongoose.Schema({

    nome: 	    String,
    tipo:	    String,
    morada:	    String,
    descricao:  String,
    distrito:   String,
    gps:        { type: [Number], index: '2dsphere'},
    igogo:      String
});

module.exports = mongoose.model('PontoTuristico', ponto, 'pontosturisticos');