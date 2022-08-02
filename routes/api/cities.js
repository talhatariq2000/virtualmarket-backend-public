var express = require('express');
const req = require('express/lib/request');
var router = express.Router();


const Controller = require("../../controllers/cities");


router.get("/getAll", Controller.getAll);

module.exports = router;