var express = require('express');
const req = require('express/lib/request');
var router = express.Router();

const Controller = require("../../controllers/admins");
const Middleware = require("../../middlewares/admin");


router.post("/create", Controller.createAdmin);
router.post("/sendOTP", Controller.sendOTP);
router.post("/login", Controller.loginAdmin);

//router.get("/anything", Middleware.authenticator, Controller.kuchbhi);


module.exports = router;