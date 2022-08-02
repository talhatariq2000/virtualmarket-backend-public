var express = require('express');
const req = require('express/lib/request');
var router = express.Router();

const upload = require("../../utils/multer");

const Controller = require("../../controllers/products");
const sellerMiddleware = require("../../middlewares/seller");
const buyerMiddleware = require("../../middlewares/buyer");
const favouriteMiddleware = require("../../middlewares/favourite");
const adminMiddleware = require("../../middlewares/admin");


//_________________________________________________________________________
//                              Seller APIs
//_________________________________________________________________________

//Add new Product
router.post("/add", upload.array('image'), sellerMiddleware.authenticator, sellerMiddleware.verifier, Controller.add);
router.get("/getAllBySeller/:page", sellerMiddleware.authenticator, sellerMiddleware.verifier, Controller.fetchAllBySeller);
router.get("/getDetailsForSeller/:id", sellerMiddleware.authenticator, sellerMiddleware.verifier, Controller.fetchDetailsforSeller);
router.patch("/editDetails/:id", sellerMiddleware.authenticator, sellerMiddleware.verifier, Controller.editProductDetails);
router.patch("/deleteImage/:id", sellerMiddleware.authenticator, sellerMiddleware.verifier, Controller.delImg);
router.patch("/addImage/:id", upload.single('image'), sellerMiddleware.authenticator, sellerMiddleware.verifier, Controller.addImg);
router.delete("/del/:id", sellerMiddleware.authenticator, sellerMiddleware.verifier, Controller.del);
router.patch("/updateStock/:id", sellerMiddleware.authenticator, sellerMiddleware.verifier, Controller.changeStock);


//_________________________________________________________________________
//                              Buyer APIs
//_________________________________________________________________________

router.get("/search/:key", Controller.search);
router.get("/getFiveByCategory/:category", Controller.fetchFiveByCategory);
router.get("/getByCategory/:category", Controller.fetchByCategory);
router.get("/details/:id", buyerMiddleware.checker, favouriteMiddleware.checker, Controller.fetchOneDetails);
router.get("/getBySeller/:id", Controller.fetchByStore);

//_________________________________________________________________________
//                              Admin APIs
//_________________________________________________________________________

router.get("/getList/:status", adminMiddleware.authenticator, Controller.fetchList);
router.get("/getBySeller/:id", adminMiddleware.authenticator, Controller.fetchBySeller);
router.get("/getAllDetails/:id", adminMiddleware.authenticator, Controller.fetchAllDetails);
router.patch("/changeStatus/:id", adminMiddleware.authenticator, Controller.changeStatus);
router.get("/getActiveProducts", adminMiddleware.authenticator, Controller.getActiveProducts);

module.exports = router;