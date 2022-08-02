const { Cart } = require("../models/cart");


//Checking for Cart Items
module.exports.checkerForCheckout = async (req,res,next) => {

    try
    {
        let cart = await Cart.findOne({_id: req.params.id, buyer: req.buyer._id}).populate('seller').populate('items.product').populate('items.offer').lean();
        
        if  (!cart || cart.items.length==0)
        {
            return res.status(400).send("Cart is Empty");
        }
        else
        {
            for(item of cart.items)
            {
                if (!item.product || item.product.status != 'APPROVED')
                {
                    return res.status(400).send("A Product in Cart is no longer available on the market");
                }
                if (item.type==='DEFAULT')
                {
                    if ( item.product.stock < item.product.minOrder )
                    {
                        return res.status(400).send(item.product.name + " is Out of Stock");
                    }
                    if(item.quantity < item.product.minOrder)
                    {
                        return res.status(400).send("Minimum " + item.product.minOrder + " items of " + item.product.name + " can be ordered");
                    }
                    else if(item.quantity > item.product.stock)
                    {
                        return res.status(400).send("Maximum " + item.product.stock + " items of " + item.product.name + " can be ordered");
                    }
                }
                else if (item.type==='OFFER')
                {
                    if(item.offer.status==='EXPIRED')
                    {
                        return res.status(400).send("Offer has expired");
                    }
                    if(item.offer.quantity > item.product.stock)
                    {
                        return res.status(400).send("Maximum " + item.product.stock + " items of " + item.product.name + " can be ordered");
                    }
                    item.quantity = item.offer.quantity; 
                }
                else if (item.type==='SAMPLE')
                {
                    if ( item.product.stock === 0 )
                    {
                        return res.status(400).send(item.product.name + " is Out of Stock");
                    }
                }
            }

            req.cart = cart;
            next();
        }
        
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
    
};

//Calculating Prices for Checkout
module.exports.calculateCartTotals = async(req,res,next) => {

    try
    {
        //Calculating Prices for Order
        var subTotal = 0;
        var regularOrder = false;

        for (index=0; index<req.cart.items.length; index++)
        {
            if(req.cart.items[index].type === "DEFAULT")
            {
                regularOrder = true;
                req.cart.items[index].totalPrice = req.cart.items[index].product.price * req.cart.items[index].quantity;
                subTotal += req.cart.items[index].totalPrice;
            }
            else if(req.cart.items[index].type === "SAMPLE")
            {
                req.cart.items[index].totalPrice = 0;
            }
            else if(req.cart.items[index].type === "OFFER")
            {
                req.cart.items[index].totalPrice = req.cart.items[index].offer.price;
                subTotal += req.cart.items[index].totalPrice;
            }
        }

        if ( req.cart.buyer.city === req.cart.seller.city )
        {
            req.cart.seller.deliveryCharge = req.cart.seller.sameCityDeliveryCharge;
        }
        else
        {
            req.cart.seller.deliveryCharge = req.cart.seller.diffCityDeliveryCharge;
        }

        if ( !regularOrder )
        {
            req.cart.seller.deliveryCharge = 0;
        }

        req.cart.subTotal = subTotal;
        req.cart.total = subTotal + req.cart.seller.deliveryCharge;

        if (req.cart.total>=999999)
        {
            return res.status(400).send("Order is exceeding Rs.999999");
        }

        req.cart.advance = 0;
        req.cart.cashOnDelivery = req.cart.total;

        if (req.cart.seller.advancePayment === true)
        {
            if ( req.cart.total >= req.cart.seller.advancePaymentCriteria )
            {
                req.cart.advance = Math.floor((req.cart.total/100)*req.cart.seller.advancePaymentAmount);
                req.cart.cashOnDelivery = req.cart.total - req.cart.advance;
                if (req.cart.advance>=999999)
                {
                    return res.status(400).send("Advance Payment is exceeding Rs.999999");
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