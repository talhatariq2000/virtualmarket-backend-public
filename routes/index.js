var express = require('express');
var router = express.Router();

const cloudinary = require("../utils/cloudinary");
const upload = require("../utils/multer");

/* GET home page. */
router.get('/', function(req, res, next) {
  return res.status(404).send("Invalid URL");
  
});

router.post('/', function(req, res, next) {
  return res.status(404).send("Invalid URL");
});

router.patch('/', function(req, res, next) {
  return res.status(404).send("Invalid URL");
});

router.put('/', function(req, res, next) {
  return res.status(404).send("Invalid URL");
});

//Reference Function for Many Image Upload to Cloudinary
router.post("/upload", upload.array('image'), async (req,res) => {
  console.log(req);
  
  try{
      const urls = [];

      const files = req.files;
      console.log(req.files);
      for(const file of files) {

          const { path } = file;
          const newPath = await cloudinary.uploader.upload(path);

          urls.push({avatar: newPath.secure_url, cloudinaryID: newPath.public_id});

          fs.unlinkSync(path);
      }
      return res.send(urls);
  }
  catch(err)
  {
      console.log(err);
      return res.status(401).send(err.message);
  }
});

module.exports = router;
