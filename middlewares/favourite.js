const { Favourite } = require("../models/favourite");

//Checking if Product is in Favourites
module.exports.checker = async (req,res,next) => {

    try
    {
        req.favourite = false;
        if (req.buyer)
        {
            let favourite = await Favourite.findOne({Buyer: req.buyer._id});
            if (favourite)
            {
                if (favourite.products.includes(req.params.id))
                {
                    req.favourite = true;
                }
            }
        }
        next();
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
    
};