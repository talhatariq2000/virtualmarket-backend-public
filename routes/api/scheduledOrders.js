var express = require('express');
const req = require('express/lib/request');
var router = express.Router();


const Controller = require("../../controllers/scheduledOrders");
const buyerMiddleware = require("../../middlewares/buyer");
const productMiddleware = require("../../middlewares/product");

//_________________________________________________________________________
//                              Buyer
//_________________________________________________________________________

router.get("/getByBuyer", buyerMiddleware.authenticator, buyerMiddleware.verifier, Controller.getByBuyer);
router.get("/getSingleDetails/:id", buyerMiddleware.authenticator, buyerMiddleware.verifier, Controller.getSingleDetails);
router.post("/add", buyerMiddleware.authenticator, productMiddleware.validator, Controller.add);
router.patch("/edit/:id", buyerMiddleware.authenticator, buyerMiddleware.verifier, Controller.edit);
router.delete("/del/:id", buyerMiddleware.authenticator, buyerMiddleware.verifier, Controller.del);
router.get("/presetOptions", Controller.getPresetArray);

module.exports = router;