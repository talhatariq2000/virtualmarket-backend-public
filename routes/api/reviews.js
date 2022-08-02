var express = require('express');
const req = require('express/lib/request');
var router = express.Router();


const Controller = require("../../controllers/reviews");
const buyerMiddleware = require("../../middlewares/buyer");
const orderMiddleware = require("../../middlewares/order");
const productMiddleware = require("../../middlewares/product");


router.post("/add/:id", buyerMiddleware.authenticator, buyerMiddleware.verifier, orderMiddleware.itemCheckerForReview, productMiddleware.validator, Controller.addReview);
router.get("/getByProduct/:id", Controller.fetchByProduct);

module.exports = router;