/**
 * Created by André on 13/10/2014.
 */

var mongoose = require('mongoose');

var rota = mongoose.Schema({
    pontos:             { type: [mongoose.Schema.Types.ObjectId], ref: 'PontoTuristico', index: true },
    distanciaTotal:     Number, // distancia total em km do percurso
    descricao:          String,

    date: { type: Date, default: Date.now },

    likes:              {type: [mongoose.Schema.Types.ObjectId], index: true},

    ratings:            {type: [{user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}, rating: Number, comentario: String}], index: true},

    dataCriacao:        {type: Date, default: Date.now},
    meiosTransporte:    [String], // pedestre, bicicleta...
    tipo:               String,

    desconto: {
        descricao: String,
        percentagem: {type: Number, default: 0}
    }

});

module.exports = mongoose.model('Rota', rota, 'rotas');