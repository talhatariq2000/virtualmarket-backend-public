const { Product } = require("../models/product");
const productController = require("../controllers/products");

//Checking for Valid Product ID
module.exports.validator = async (req,res,next) => {

    try
    {
        let product = await Product.findById(req.body.product);
        if(!product)
        {
            return res.status(400).send("Product does not Exist");
        }
        if ( product.status!='APPROVED' )
        {
            return res.status(401).send("Product is not Listed");
        }
        else
        {
            req.product = product;
            next();
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
    
};


// //Final Check for Checkout
module.exports.updateProductsForCheckout = async(req,res,next) => {

    try
    {
        let quantities = [];
        let cont = true;

        for (item of req.cart.items)
        {
            let product = await Product.findById(item.product._id);
            
            if (product.stock-item.quantity<0)
            {
                cont = false;
                res.status(400).send(product.name + " available stock has changed");
                break;
            }
            else
            {
                productController.updateStock(item.product._id, item.quantity*-1);
                quantities.push({id: item.product._id, quantity: item.quantity});
            }
        }

        if (cont===true)
        {
            req.quantities = quantities;
            next();
        }
        else if (cont===false)
        {
            productController.addStockforFailure(quantities);
            return;
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};