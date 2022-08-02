var express = require('express');
const req = require('express/lib/request');
var router = express.Router();

const upload = require("../../utils/multer");

const Controller = require("../../controllers/sellers");
const Middleware = require("../../middlewares/seller");
const adminMiddleware = require("../../middlewares/admin");

//Logged-Out Seller
router.post("/signup", Controller.createSeller);
router.post("/login", Controller.loginSeller);
router.post("/forgotPassword", Controller.forgotPasswordOTP);
router.patch("/resetPassword/:id", Controller.resetPassword);


//Logged-In Seller
router.post("/getVerificationCode", Middleware.authenticator, Controller.getVerificationCode);
router.post("/verify", Middleware.authenticator, Controller.verify);
router.get("/getStatus", Middleware.authenticator, Controller.getStatus);
router.get("/getDetails", Middleware.authenticator, Controller.getDetails);
router.patch("/addDetails", Middleware.authenticator, upload.array('image'), Controller.addDetails);
router.patch("/editDetails", Middleware.authenticator, Middleware.verifier, Controller.editDetails);
router.post("/editAvatar", upload.single('image'), Middleware.authenticator, Middleware.verifier, Controller.editAvatar);
router.get("/getBalance", Middleware.authenticator, Controller.fetchBalance);


//_________________________________________________________________________
//                              Admin APIs
//_________________________________________________________________________

router.get("/getList/:status", adminMiddleware.authenticator, Controller.fetchList);
router.get("/getFullDetails/:id", adminMiddleware.authenticator, Controller.fetchFullDetails);
router.patch("/approveSeller/:id", adminMiddleware.authenticator, Controller.approveSeller);
router.patch("/changeStatus/:id", adminMiddleware.authenticator, Controller.changeStatus);
router.get("/getActiveSellers", adminMiddleware.authenticator, Controller.getActiveSellers);
router.patch("/hold/:id", adminMiddleware.authenticator, Controller.hold);

//_________________________________________________________________________
//                              Buyer APIs
//_________________________________________________________________________

router.get("/getStoreDetails/:id", Controller.getStoreDetails);

module.exports = router;