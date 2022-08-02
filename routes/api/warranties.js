var express = require('express');
const req = require('express/lib/request');
var router = express.Router();


const Controller = require("../../controllers/warranties");
const buyerMiddleware = require("../../middlewares/buyer");
const sellerMiddleware = require("../../middlewares/seller");
const adminMiddleware = require("../../middlewares/admin");

//_________________________________________________________________________
//                              Buyer
//_________________________________________________________________________

router.get("/getByBuyer/:status", buyerMiddleware.authenticator, Controller.getByBuyer);
router.patch("/request/:id", buyerMiddleware.authenticator, buyerMiddleware.verifier, Controller.request);

//_________________________________________________________________________
//                              Seller
//_________________________________________________________________________

router.get("/getBySeller/:status", sellerMiddleware.authenticator, sellerMiddleware.verifier, Controller.getBySeller);
router.get("/getDetails/:id", sellerMiddleware.authenticator, sellerMiddleware.verifier, Controller.getBySellerDetail);
router.patch("/respond/:id", sellerMiddleware.authenticator, sellerMiddleware.verifier, Controller.respond);

//_________________________________________________________________________
//                              Admin
//_________________________________________________________________________

router.get("/getAll/:status", adminMiddleware.authenticator, Controller.getAll);
router.get("/getCompleteDetails/:id", adminMiddleware.authenticator, Controller.getCompleteDetail);
router.patch("/adminResponse/:id", adminMiddleware.authenticator, Controller.adminResponse);

module.exports = router;