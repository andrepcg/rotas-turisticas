var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var async = require("async");

var PontoTuristico = require("../models/PontoTuristico");
var Rotas = require("../models/Rota");

function getPonto(id, slug, callback){
	if(id && !slug){
		PontoTuristico.findById(id)
			.exec(function(err, ponto){
				if(err){
					console.error(err);
					return callback(err);
				}

				callback(null, ponto);
			});
	}
	else if(id && slug){
		PontoTuristico.findOne({"id": id, "slug": slug})
		.exec(function(err, ponto){
			if(err){
				console.error(err);
				return callback(err);
			}

			callback(null, ponto);
		});
	}
}

function getNearby(coords, maxDistance, callback){
	PontoTuristico.geoNear({type: "Point", localizacao: { gps: coords }}, {
			spherical: true, 
			maxDistance: maxDistance / 6378137, 
			distanceMultiplier: 6378137,
			limit: 10
		},function(err, pontos){
			if(err){
				console.error(err);
				return callback(err);
			}

			callback(null, pontos);

		});
}

function getRotasCruzamPonto(id, callback){
	Rotas.find({pontos: id})
		.exec(function(err, data){
			if(err){
				console.error(err);
				return callback(err);
			}

			callback(null, data);
		});
}

function renderPage(req, res, next){

	if(mongoose.Types.ObjectId.isValid(req.params.id)){
		var id = new mongoose.Types.ObjectId(req.params.id);
		var slug = req.params.slug;

		var objectos = {};

		async.parallel({
			ponto: async.apply(getPonto, id, slug),
			//rotas: async.apply(getRotasCruzamPonto, id)

		}, function (error, results) {
		    if (error) {
		    	res.status(500).send(error);
		    	console.error(error);
		    	return;
		    }

		    if(results.ponto){
		    	objectos.ponto = results.ponto;
		    	console.log(results.ponto.localizacao.gps);
			    getNearby(results.ponto.localizacao.gps, 1000, function(pontosProximos){
			    	objectos.pontosProximos = pontosProximos;

			    });
		    }
		    else{
		    	res.status(404);
		    	next({message: "Nopeeeee"});
		    	//res.redirect("/");
		    }
		    

		});

		//res.render('index', { title: 'Express' });
	}
	else{
		res.redirect("/");
	}
}


router.get('/:id', renderPage);
router.get('/:id/:slug', renderPage);

module.exports = router;