var express = require('express');
const req = require('express/lib/request');
var router = express.Router();

const upload = require("../../utils/multer");

const Controller = require("../../controllers/buyers");
const Middleware = require("../../middlewares/buyer");
const adminMiddleware = require("../../middlewares/admin");

//Logged-Out Buyer
router.post("/signup", Controller.createBuyer);
router.post("/login", Controller.loginBuyer);
router.post("/forgotPassword", Controller.forgotPasswordOTP);
router.patch("/resetPassword/:id", Controller.resetPassword);

router.patch("/verifyEmail", Controller.verifyEmail);

//Logged-in Buyer
router.get("/getAvatar", Middleware.authenticator, Controller.getAvatar);
router.get("/getDetails", Middleware.authenticator, Controller.getDetails);
router.patch("/editDetails", Middleware.authenticator, Controller.editDetails);
router.post("/editAvatar", Middleware.authenticator, upload.single('image'), Controller.editAvatar);
router.patch("/changePassword", Middleware.authenticator, Controller.changePassword);
router.post("/verificationOTP", Middleware.authenticator, Controller.verificationOTP);
router.post("/verify", Middleware.authenticator, Controller.verify);

router.get("/getDeliveryDetails", Middleware.authenticator, Middleware.verifier, Controller.fetchDeliveryDetails);
router.get("/getStatus", Middleware.authenticator, Controller.getStatus);

//_________________________________________________________________________
//                              Admin APIs
//_________________________________________________________________________

router.get("/getList/:status", adminMiddleware.authenticator, Controller.fetchList);
router.get("/getFullDetails/:id", adminMiddleware.authenticator, Controller.fetchFullDetails);
router.patch("/changeStatus/:id", adminMiddleware.authenticator, Controller.changeStatus);

//Reference Function for many image uploads
router.post("/upload", upload.array('image'), Controller.upload);

module.exports = router;