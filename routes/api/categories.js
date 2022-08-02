var express = require('express');
const req = require('express/lib/request');
var router = express.Router();


const Controller = require("../../controllers/categories");
//const Middleware = require("../../middlewares/buyer");


router.get("/getAll", Controller.getAll);

module.exports = router;