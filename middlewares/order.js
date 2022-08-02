const { Order } = require("../models/order");
const dotenv = require("dotenv").config();
const stripe = require('stripe')(process.env.STRIPE_KEY)

//Conducting Stripe Payment
module.exports.stripePayment = async (req,res,next) => {

    try
    {
        try
        {
            const payment = await stripe.paymentIntents.create({
                amount: req.cart.total*100,
                currency: "PKR",
                description: "Payment from Buyer " + req.cart.buyer + " to Seller " + req.cart.seller._id,
                payment_method: req.body.id,
                confirm: true
            });
            console.log("Payment", payment);
            return res.status(200).send("Payment Succeeded");
        }
        catch(err)
        {
            console.log("Error", err)
		    res.status(500).send("Payment Failed");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
    
};

//Checking Un-Reviewed Item in Cart
module.exports.itemCheckerForReview = async(req,res,next) => {

    try
    {
        let order = await Order.findOne({ _id: req.params.id, Buyer: req.buyer._id });
        if(order)
        {
            let found = false;
            for(item of order.items)
            {
                if( item._id.toString()===req.body.item )
                {
                    found = true;
                    if( !item.reviewed )
                    {
                        req.body.product = item.Product;
                        next();
                    }
                    else
                    {
                        return res.status(400).send("Item Already Reviewed");
                    }
                }
            }
            if (!found)
            {
                return res.status(400).send("Item Does not Exist");
            }
        }
        else
        {
            return res.status(400).send("Order Does not Exist");
        }
        
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};