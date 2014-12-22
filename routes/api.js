/**
 * Created by André on 22/10/2014.
 */
var express = require('express');
var router = express.Router();
var PontoTuristico = require('../models/PontoTuristico');
var Rota = require('../models/Rota');


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

module.exports = router;
