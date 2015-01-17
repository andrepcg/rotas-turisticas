var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var async = require("async");

var PontoTuristico = require("../models/PontoTuristico");
var Rotas = require("../models/Rota");


//router.get('/:pais', renderPage);
//router.get('/:pais/:cidade', renderPage);

module.exports = router;