var express = require('express');
const req = require('express/lib/request');
var router = express.Router();


const Controller = require("../../controllers/offers");
const buyerMiddleware = require("../../middlewares/buyer");
const sellerMiddleware = require("../../middlewares/seller");
const chatMiddleware = require("../../middlewares/chat");
const productMiddleware = require("../../middlewares/product");

//_________________________________________________________________________
//                              Buyer
//_________________________________________________________________________

router.post("/sendOffer", buyerMiddleware.authenticator, buyerMiddleware.verifier, productMiddleware.validator, chatMiddleware.getChat, Controller.create);

//_________________________________________________________________________
//                              Seller
//_________________________________________________________________________

router.patch("/reactOffer/:id", sellerMiddleware.authenticator, sellerMiddleware.verifier, Controller.react);

module.exports = router;