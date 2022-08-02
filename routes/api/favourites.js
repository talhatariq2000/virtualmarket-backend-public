var express = require('express');
const req = require('express/lib/request');
var router = express.Router();


const Controller = require("../../controllers/favourites");
const buyerMiddleware = require("../../middlewares/buyer");
const productMiddleware = require("../../middlewares/product");


router.post("/add", buyerMiddleware.authenticator, productMiddleware.validator, Controller.add);
router.get("/getProducts", buyerMiddleware.authenticator, Controller.getProducts);
router.delete("/removeProduct/:id", buyerMiddleware.authenticator, Controller.removeProduct);

module.exports = router;