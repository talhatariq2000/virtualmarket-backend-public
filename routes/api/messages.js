var express = require('express');
const req = require('express/lib/request');
var router = express.Router();

const upload = require("../../utils/multer");

const Controller = require("../../controllers/messages");
const buyerMiddleware = require("../../middlewares/buyer")
const sellerMiddleware = require("../../middlewares/seller");
const chatMiddleware = require("../../middlewares/chat");


//_________________________________________________________________________
//                              Buyer
//_________________________________________________________________________

router.post("/sendText/:id", buyerMiddleware.authenticator, buyerMiddleware.verifier, chatMiddleware.checkChat, Controller.sendText);
router.post("/sendImage/:id", upload.single('image'), buyerMiddleware.authenticator, buyerMiddleware.verifier, chatMiddleware.checkChat, Controller.sendImage);
router.get("/getBuyerMessages/:id", buyerMiddleware.authenticator, buyerMiddleware.verifier, chatMiddleware.checkChat, chatMiddleware.buyerReadUpdate, Controller.getMessages);

//_________________________________________________________________________
//                              Seller
//_________________________________________________________________________

router.get("/getSellerMessages/:id", sellerMiddleware.authenticator, sellerMiddleware.verifier, chatMiddleware.checkChat, chatMiddleware.sellerReadUpdate, Controller.getMessages);
router.post("/replyText/:id", sellerMiddleware.authenticator, sellerMiddleware.verifier, chatMiddleware.checkChat, Controller.replyText);
router.post("/replyImage/:id", upload.single('image'), sellerMiddleware.authenticator, sellerMiddleware.verifier, chatMiddleware.checkChat, Controller.replyImage);

module.exports = router;