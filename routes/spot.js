var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var async = require("async");

var PontoTuristico = require("../models/PontoTuristico");
var Rotas = require("../models/Rotas");

function getPonto(id, callback){
	PontoTuristico.findOneById(id)
		.exec(function(err, ponto){
			if(err){
				console.error(err);
				return callback(err);
			}

			callback(null, ponto);
		});
}

function getNearby(coords, maxDistance, callback){
	PontoTuristico.geoNear({type: "Point", localizacao: { gps: coords }}, {
			spherical: true, 
			maxDistance: maxDistance / 6378137, 
			distanceMultiplier: 6378137
		})
		.limit(10)
		.exec(function(err, pontos){
			if(err){
				console.error(err);
				return callback(err);
			}

			callback(null, pontos);

		});
}

function getRotasComPonto(id, callback){
	Rotas.find({pontos: id)
		.exec(function(err, data){
			if(err){
				console.error(err);
				return callback(err);
			}

			callback(null, data);
		});
}

function renderPage(req, res){

	if(mongoose.Types.ObjectId.isValid(req.params.id)){
		var id = new mongoose.Types.ObjectId(req.params.id);

		var objectos = {};

		async.parallel({
			ponto: async.apply(getPonto, id),
			rotas: async.apply(getRotasComPonto, id)

		}, function (error, results) {
		    if (error) {
		    	res.status(500).send(error);
		    	return;
		    }

		    if(results.ponto){
		    	objectos.ponto = results.ponto;
			    getNearby(results.ponto.localizacao.gps, 1000, function(pontosProximos){
			    	objectos.pontosProximos = pontosProximos;
			    });
		    }
		    else
		    	res.redirect("/");
		    

		});

		res.render('index', { title: 'Express' });
	}
	else{

	}
}


router.get('/:id', renderPage);
router.get('/:id/:slug', renderPage);

module.exports = router;
