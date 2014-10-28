/**
 * Created by André on 13/10/2014.
 */

var mongoose = require('mongoose');

var rota = mongoose.Schema({
    pontos:             { type: [mongoose.Schema.Types.ObjectId], ref: 'PontoTuristico', index: true },
    distanciaPercurso:  Number, // distancia total em km do percurso
    descricao:          String,
    likes:              Number,
    ratings:            [{user: String, rating: Number, comentario: String}],
    dataCriacao:        {type: Date, default: Date.now},
    meios:               [String] // pedestre, bicicleta...


});

module.exports = mongoose.model('Rota', rota, 'rotas');