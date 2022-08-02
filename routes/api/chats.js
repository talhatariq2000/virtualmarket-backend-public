var express = require('express');
const req = require('express/lib/request');
var router = express.Router();


const Controller = require("../../controllers/chats");
const buyerMiddleware = require("../../middlewares/buyer")
const sellerMiddleware = require("../../middlewares/seller");

//_________________________________________________________________________
//                              Buyer
//_________________________________________________________________________

router.post("/initiate", buyerMiddleware.authenticator, buyerMiddleware.verifier, sellerMiddleware.checkSeller, Controller.initiate);
router.get("/getBuyerChats", buyerMiddleware.authenticator, buyerMiddleware.verifier, Controller.getBuyerChats);

//_________________________________________________________________________
//                              Seller
//_________________________________________________________________________

router.get("/getSellerChats", sellerMiddleware.authenticator, sellerMiddleware.verifier, Controller.getSellerChats);


module.exports = router;