const { Offer } = require("../models/offer");

//Checking Offer from Request
module.exports.checker = async (req,res,next) => {

    try
    {
        let offer = await Offer.findById(req.params.id).populate('Product');

        if (!offer)
        {
            return res.status(400).send("Offer Not Found");
        }
        else
        {
            if (!offer.Product || offer.Product.status!="APPROVED")
            {
                return res.status(400).send("Product no longer available");
            }

            let nowDate = new Date();
            if ( offer.expiry < nowDate )
            {
                return res.status(400).send("Offer Expired");
            }
            else
            {
                req.offer = offer;
                next();
            }
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
    
};