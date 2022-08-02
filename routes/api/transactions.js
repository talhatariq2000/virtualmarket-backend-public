var express = require('express');
const req = require('express/lib/request');
var router = express.Router();


const Controller = require("../../controllers/transactions");
const sellerMiddleware = require("../../middlewares/seller");
const adminMiddleware = require("../../middlewares/admin");
const orderMiddleware = require("../../middlewares/order");

//_________________________________________________________________________
//                              Seller APIs
//_________________________________________________________________________

router.get("/getBySeller", sellerMiddleware.authenticator, sellerMiddleware.verifier, Controller.fetchSellerTransactions);
router.post("/requestWithdrawal", sellerMiddleware.authenticator, sellerMiddleware.verifier, Controller.createWithdrawal);

//_________________________________________________________________________
//                              Admin APIs
//_________________________________________________________________________

router.get("/getAll/:status", adminMiddleware.authenticator, Controller.fetchAllTransactions);
router.get("/getDetails/:id", adminMiddleware.authenticator, Controller.fetchDetails);
router.post("/adminRequestWithdrawal/:id", adminMiddleware.authenticator, sellerMiddleware.checkSellerForWithdrawal, Controller.adminCreateWithdrawal);
router.patch("/respondWithdrawal/:id", adminMiddleware.authenticator, Controller.adminRespondWithdrawal);
router.patch("/respondRefund/:id", adminMiddleware.authenticator, Controller.adminRespondRefund);
router.patch("/adminDeductAmount/:id", adminMiddleware.authenticator, sellerMiddleware.checkSellerForWithdrawal, Controller.adminDeductAmount);


module.exports = router;