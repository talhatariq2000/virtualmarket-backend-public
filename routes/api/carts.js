var express = require('express');
const req = require('express/lib/request');
var router = express.Router();


const Controller = require("../../controllers/carts");
const Middleware = require("../../middlewares/cart");
const buyerMiddleware = require("../../middlewares/buyer");
const productMiddleware = require("../../middlewares/product");
const offerMiddleware = require("../../middlewares/offer");


router.get("/count", buyerMiddleware.authenticator, Controller.getItemCount);
router.post("/add", buyerMiddleware.authenticator, productMiddleware.validator, Controller.addToCart);
router.post("/addOffer/:id", buyerMiddleware.authenticator, offerMiddleware.checker, Controller.addOfferToCart);
router.delete("/clearCart", buyerMiddleware.authenticator, Controller.clearCart);
router.delete("/clearItems/:id", buyerMiddleware.authenticator, Controller.clearItems);
router.get("/get", buyerMiddleware.authenticator, Controller.getCart);
router.patch("/incQty/:id", buyerMiddleware.authenticator, Controller.incItem);
router.patch("/decQty/:id", buyerMiddleware.authenticator, Controller.decItem);
router.patch("/setQty/:id", buyerMiddleware.authenticator, Controller.setItem);
router.patch("/delete/:id", buyerMiddleware.authenticator, Controller.deleteItem);
router.get("/proceedToCheckout/:id", buyerMiddleware.authenticator, buyerMiddleware.verifier, Middleware.checkerForCheckout, Middleware.calculateCartTotals, Controller.proceedToCheckout);
router.get("/getCheckoutCart/:id", buyerMiddleware.authenticator, Controller.getSingleCart);
router.get("/getSellerPaymentMethods", buyerMiddleware.authenticator, buyerMiddleware.verifier, Controller.fetchSellerPaymentMethod);

module.exports = router;