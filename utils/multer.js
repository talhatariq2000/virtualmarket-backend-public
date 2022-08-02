const multer = require("multer");
const path = require("path");

module.exports = multer({

    storage: multer.diskStorage({}),
    fileFilter: (req,file,cb, res) => {
        let ext = path.extname(file.originalname);
        if(ext !== ".jpg" && ext !== ".jpeg" && ext !== ".png")
        {
            console.log("INVALID IMAGE TYPE");
            cb(null, false);
        }
        cb(null, true);
    },
});