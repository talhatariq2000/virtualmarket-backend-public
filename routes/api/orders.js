var express = require('express');
const req = require('express/lib/request');
var router = express.Router();


const Controller = require("../../controllers/orders");
const Middleware = require("../../middlewares/order");
const buyerMiddleware = require("../../middlewares/buyer");
const sellerMiddleware = require("../../middlewares/seller");
const adminMiddleware = require("../../middlewares/admin");
const cartMiddleware = require("../../middlewares/cart");
const productMiddleware = require("../../middlewares/product");



//_________________________________________________________________________
//                              Buyer APIs
//_________________________________________________________________________

//router.post("/codCheckout/:id", buyerMiddleware.authenticator, buyerMiddleware.verifier, cartMiddleware.checkerForCheckout, cartMiddleware.calculateCartTotals, Controller.codCheckout);
//router.post("/onlinePaymentCheckout/:id", buyerMiddleware.authenticator, buyerMiddleware.verifier, cartMiddleware.checkerForCheckout, cartMiddleware.calculateCartTotals, Controller.opCheckout);
router.post("/checkout/:id", buyerMiddleware.authenticator, buyerMiddleware.verifier, cartMiddleware.checkerForCheckout, cartMiddleware.calculateCartTotals, productMiddleware.updateProductsForCheckout, Controller.checkout);
router.get("/getBuyerOrders", buyerMiddleware.authenticator, Controller.fetchBuyerOrders);
router.get("/getBuyerOrderDetails/:id", buyerMiddleware.authenticator, Controller.fetchBuyerOrderDetails);
router.patch("/cancel/:id", buyerMiddleware.authenticator, buyerMiddleware.verifier, Controller.cancel);

//_________________________________________________________________________
//                              Seller APIs
//_________________________________________________________________________

router.get("/getSellerOrders/:status", sellerMiddleware.authenticator, sellerMiddleware.verifier, Controller.fetchSellerOrders);
router.get("/getOrderDetails/:id", sellerMiddleware.authenticator, sellerMiddleware.verifier, Controller.fetchOrderDetails);
router.patch("/changeStatus/:id", sellerMiddleware.authenticator, sellerMiddleware.verifier, Controller.changeStatus);
router.patch("/concludeOrder/:id", sellerMiddleware.authenticator, sellerMiddleware.verifier, Controller.concludeOrder);
router.get("/getMonthlyOrders", sellerMiddleware.authenticator, Controller.getMonthlyOrders);

//_________________________________________________________________________
//                              Admin APIs
//_________________________________________________________________________

router.get("/getAllOrders/:status", adminMiddleware.authenticator, Controller.fetchAllOrders);
router.get("/getCompleteDetails/:id", adminMiddleware.authenticator, Controller.fetchOrderCompleteDetails);


//Seller Dashboard
router.get("/getOrdersCount", sellerMiddleware.authenticator, sellerMiddleware.verifier, Controller.getOrdersCount);

module.exports = router;