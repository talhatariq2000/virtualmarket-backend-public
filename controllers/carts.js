const express = require('express');
const mongoose = require("mongoose");
const _ = require("lodash");
const config = require("config");

const Mailer = require("../utils/mailer");

const { Cart } = require("../models/cart");
const productController = require("./products");
const offerController = require("./offers");
const buyerController = require("./buyers");

//Get Item Count
module.exports.getItemCount = async(req,res) => {
    try
    {
        let carts = await Cart.find({buyer: req.buyer._id});
        count = carts.length;
        return res.send({count});
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Adding Items to Cart
module.exports.addToCart = async (req,res) => {
    
    try
    {
        //Finding Existing Cart for Buyer
        let cart = await Cart.findOne({buyer: req.buyer._id, seller: req.product.seller});
        if(!cart)
        {
            let id = new mongoose.Types.ObjectId();
            cart = await Cart.create({_id: id, buyer: req.buyer._id, seller: req.product.seller});
        }

        //For DEFAULT Product
        if(req.body.type === "DEFAULT")
        {
            if( req.product.minOrder > req.product.stock)
            {
                return res.status(400).send("Product Out of Stock");
            }
            //Checking if Item already in Cart
            for(item of cart.items)
            {
                if(item.product === req.body.product )
                {
                    if ( item.type === "SAMPLE" || item.type === "OFFER" )
                    {
                        return res.status(400).send("Product already in cart");
                    }
                    else if ( item.type === "DEFAULT" )
                    {
                        if ( req.body.quantity + item.quantity <= req.product.stock )
                        {
                            item.quantity += req.body.quantity;
                            await Cart.findByIdAndUpdate(cart._id, { items: cart.items });
                            return res.send("Item Added to Cart");
                        }
                        else
                        {
                            return res.status(400).send("Only " + req.product.stock + " Pieces Available");
                        }
                    }
                }
            }
            //If New Item
            if( req.body.quantity >= req.product.minOrder )
            {
                if( req.body.quantity <= req.product.stock )
                {
                    cart.items.push({product: req.body.product, type: "DEFAULT", quantity: req.body.quantity});
                }
                else
                {
                    return res.status(400).send("Maximum of " + req.product.stock + " pieces can be ordered")    
                }
            }
            else
            {
                return res.status(400).send("Minimum of " + req.product.minOrder + " pieces can be ordered")
            }
        }

        //For Sample Order
        if(req.body.type === "SAMPLE")
        {
            if (!req.product.sampleOrder)
            {
                return res.status(400).send("Unauthorized");
            }
            if ( req.product.stock === 0 )
            {
                return res.status(400).send("Product Out of Stock");
            }

            //Checking if Item already in Cart
            for(item of cart.items)
            {
                if( item.product === req.body.product )
                {
                    return res.status(400).send("Product already in cart");
                }
            }
            cart.items.push({product: req.body.product, type: "SAMPLE", quantity: 1});
        }
        
        await Cart.findByIdAndUpdate(cart._id, { items: cart.items });
        return res.send("Item Added to Cart");
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Add Accepted Offer to Cart
module.exports.addOfferToCart = async (req,res) => {

    try
    {

        if ( req.buyer._id != req.offer.Buyer)
        {
            return res.status(400).send("Unauthorized");
        }
        if ( req.offer.status!='ACCEPTED')
        {
            return res.status(400).send("Unauthorized");
        }

        //Finding Existing Cart for Buyer
        let cart = await Cart.findOne({buyer: req.buyer._id, seller: req.offer.Product.seller});
        if (!cart)
        {
            let id = new mongoose.Types.ObjectId();
            cart = await Cart.create({_id: id, buyer: req.buyer._id, seller: req.offer.Product.seller});
        }

        //Checking if Item already in Cart
        for(item of cart.items)
        {
            if(item.product === req.offer.Product._id )
            {
                return res.status(400).send("Product already in cart");
            }
        }

        //If New Item
        if( req.offer.quantity <= req.offer.Product.stock )
        {
            cart.items.push({product: req.offer.Product, type: "OFFER", offer: req.offer._id});
            await Cart.findByIdAndUpdate(cart._id, { items: cart.items });
            offerController.updateAdded(req.offer._id);
            return res.send("Item Added to Cart");
        }
        else
        {
            return res.status(400).send("Current Stock is " + req.product.stock );    
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Delete Carts belonging to Buyer
module.exports.clearCart = async(req,res) => {

    try
    {
        await Cart.deleteMany({ buyer: req.buyer._id });
        return res.send("Cart Cleared");
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Delete a Single Cart
module.exports.clearItems = async(req,res) => {

    try
    {
        await Cart.findOneAndDelete({ _id: req.params.id, buyer: req.buyer._id });
        return res.send("Items Cleared");
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Get Carts belonging to Buyer
module.exports.getCart = async(req,res) => {

    try
    {
        let carts = await Cart.find({buyer: req.buyer._id}).populate('buyer', 'city').populate('seller', 'city sameCityDeliveryCharge diffCityDeliveryCharge storeName').populate('items.product', 'name images price status').populate('items.offer').lean();
        // try
        // {
        //     await cart.populate('items.deal');
        // }
        // catch{}
        // try
        // {
        //     await cart.populate('items.offer');
        // }
        // catch{}
        console.log(carts);
        if ( carts.length === 0 )
        {
            return res.status(400).send("No Items in Cart");
        }

        //Traversing through Carts and Calculating
        var subTotal;
        var regularItems;
        for (i=0; i<carts.length; i++)
        {
            subTotal = 0;
            regularItems = false;
            for (j=0; j<carts[i].items.length; j++)
            {
                //If item.product is undefined (product deleted)
                if ( !carts[i].items[j].product || carts[i].items[j].product.status != 'APPROVED' )
                {
                    carts[i].items.splice(j,1);
                    j--;
                    continue;
                }
                if (carts[i].items[j].type === "DEFAULT")
                {
                    regularItems = true;
                    carts[i].items[j].totalPrice = carts[i].items[j].product.price * carts[i].items[j].quantity;
                    subTotal += carts[i].items[j].totalPrice;
                }
                else if (carts[i].items[j].type === "OFFER")
                {
                    if ( !carts[i].items[j].offer || carts[i].items[j].offer.status==='EXPIRED' )
                    {
                        carts[i].items.splice(j,1);
                        j--;
                        continue;
                    }
                    regularItems = true;

                    carts[i].items[j].quantity = carts[i].items[j].offer.quantity;
                    carts[i].items[j].totalPrice = carts[i].items[j].offer.price;
                    subTotal += carts[i].items[j].totalPrice;
                }
                else if (carts[i].items[j].type === "SAMPLE")
                {
                    carts[i].items[j].product.price = 0;
                    carts[i].items[j].totalPrice = 0;
                }
            }

            if (carts[i].items.length === 0)
            {
                this.delCart(carts[i]._id);
                carts.splice(i,1);
                i--;
                continue;
            }
            else
            {
                this.updateItems(carts[i]._id, carts[i].items);
            }
            
            if ( carts[i].buyer.city === carts[i].seller.city )
            {
                carts[i].seller.deliveryCharge = carts[i].seller.sameCityDeliveryCharge;
            }
            else
            {
                carts[i].seller.deliveryCharge = carts[i].seller.diffCityDeliveryCharge;
            }

            if ( !regularItems )
            {
                carts[i].seller.deliveryCharge = 0;
            }
            
            carts[i].subTotal = subTotal;
            carts[i].total = subTotal + carts[i].seller.deliveryCharge;
        }

        if( carts.length === 0)
        {
            res.status(400).send("No Items in Cart");
            return;
        }
        else
        {
            res.send(carts);
            return;
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Increase Cart Item
module.exports.incItem = async(req,res) => {

    try
    {
        let cart = await Cart.findOne({_id: req.params.id, buyer: req.buyer._id}).populate('items.product');
        if(cart)
        {
            for(item of cart.items)
            {
                if( item._id.toString()===req.body.id && item.type==="DEFAULT" )
                {
                    if( item.quantity+1 <= item.product.stock )
                    {
                        item.quantity=item.quantity+1;
                        await Cart.findOneAndUpdate({_id: cart._id, "items._id": item._id}, {"items.$.quantity": item.quantity});
                        return res.send("Item Increased");
                    }
                    else
                    {
                        return res.status(400).send("Available Stock is " + item.product.stock);
                    }
                }
                else if( item._id.toString()===req.body.id && item.type==="SAMPLE" )
                {
                    return res.status(400).send("Unauthorized");
                }
                else if( item._id.toString()===req.body.id && item.type==="OFFER" )
                {
                    return res.status(400).send("Unauthorized");
                }
            }
        }
        else
        {
            return res.status(400).send("Unable to perform Operation");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Decrease Cart Item
module.exports.decItem = async(req,res) => {

    try
    {
        let cart = await Cart.findOne({_id: req.params.id, buyer: req.buyer._id}).populate('items.product');
        if(cart)
        {
            for(item of cart.items)
            {
                if( item._id.toString()===req.body.id && item.type==="DEFAULT" )
                {
                    if( item.quantity-1 >= item.product.minOrder )
                    {
                        item.quantity=item.quantity-1;
                        await Cart.findOneAndUpdate({_id: cart._id, "items._id": item._id}, {"items.$.quantity": item.quantity});
                        return res.send("Item Decreased");
                    }
                    else
                    {
                        return res.status(400).send("Minimum Order is" + item.product.minOrder);
                    }
                }
                else if( item._id.toString()===req.body.id && item.type==="SAMPLE" )
                {
                    return res.status(400).send("Unauthorized");
                }
                else if( item._id.toString()===req.body.id && item.type==="OFFER" )
                {
                    return res.status(400).send("Unauthorized");
                }
            }
        }
        return res.status(400).send("Unable to perform Operation");
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Decrease Cart Item
module.exports.setItem = async(req,res) => {

    try
    {
        console.log(req.body);
        let cart = await Cart.findOne({_id: req.params.id, buyer: req.buyer._id}).populate('items.product');
        if(cart)
        {
            for(item of cart.items)
            {
                if( item._id.toString()===req.body.id && item.type==="DEFAULT" )
                {
                    if( req.body.quantity >= item.product.minOrder )
                    {
                        if ( req.body.quantity <= item.product.stock )
                        {
                            await Cart.findOneAndUpdate({_id: cart._id, "items._id": item._id}, {"items.$.quantity": req.body.quantity});
                            return res.send("Quantity Updated");;
                        }
                        else
                        {
                            await Cart.findOneAndUpdate({_id: cart._id, "items._id": item._id}, {"items.$.quantity": item.product.stock});
                            return res.status(400).json({ message: "Current Stock is " + item.product.stock + " Pieces", qty: item.product.stock });
                        }
                    }
                    else
                    {
                        await Cart.findOneAndUpdate({_id: cart._id, "items._id": item._id}, {"items.$.quantity": item.product.minOrder});
                        return res.status(400).json({ message: "Minimum Order is " + item.product.minOrder + " Pieces", qty:  item.product.minOrder});
                    }
                }
                else if( item._id.toString()===req.body.id && item.type==="SAMPLE" )
                {
                    return res.status(400).send("Unauthorized");
                }
                else if( item._id.toString()===req.body.id && item.type==="OFFER" )
                {
                    return res.status(400).send("Unauthorized");
                }
            }
        }
        return res.status(400).send("Unable to perform Operation");
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Delete Item from Cart
module.exports.deleteItem = async(req,res) => {

    try
    {
        let cart = await Cart.findOne({_id: req.params.id, buyer: req.buyer._id});
        if(cart)
        {
            if( cart.items.length<=1 )
            {
                await Cart.findOneAndDelete({_id: cart._id});
                return res.send("Item Deleted");
            }
            for( index=0; index<cart.items.length; index++ )
            {
                if(cart.items[index]._id.toString()===req.body.id)
                {
                    cart.items.splice(index,1);
                    await Cart.findOneAndUpdate({_id: cart._id}, {items: cart.items});
                    return res.send("Item Deleted");
                }
            }
        }
        return res.status(400).send("Unable to perform operation");
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Verify Buyer Details for checkout
module.exports.proceedToCheckout = async(req,res) => {

    try
    {
        return res.status(200).send();
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Get Carts belonging to Buyer
module.exports.getSingleCart = async(req,res) => {

    try
    {
        let cart = await Cart.findOne({_id: req.params.id, buyer: req.buyer._id}).populate('buyer', 'city').populate('seller', 'city sameCityDeliveryCharge diffCityDeliveryCharge storeName onlinePaymentOption advancePayment advancePaymentAmount advancePaymentCriteria').populate('items.product', 'name images price status stock minOrder').populate('items.offer').lean();
        // try
        // {
        //     await cart.populate('items.deal');
        // }
        // catch{}
        // try
        // {
        //     await cart.populate('items.offer');
        // }
        // catch{}

        if (!cart)
        {
            return res.status(400).send("Cart not found");
        }

        var subTotal = 0;
        var regularItems = false;
        for (j=0; j<cart.items.length; j++)
        {
            //If item.product is undefined (product deleted)
            if ( !cart.items[j].product || cart.items[j].product.status != 'APPROVED' || cart.items[j].product.stock===0 )
            {
                cart.items.splice(j,1);
                j--;
                continue;
            }
            if (cart.items[j].type === "DEFAULT")
            {
                //Out of Stock Check
                if ( cart.items[j].product.minOrder>cart.items[j].product.stock )
                {
                    cart.items.splice(j,1);
                    j--;
                    continue;
                }
                //Stock Change Check
                if ( cart.items[j].quantity > cart.items[j].product.stock )
                {
                    cart.items[j].quantity = cart.items[j].product.stock;
                }
                //minOrder Change Check
                if ( cart.items[j].quantity < cart.items[j].product.minOrder )
                {
                    cart.items[j].quantity = cart.items[j].product.minOrder;
                }
                regularItems = true;
                cart.items[j].totalPrice = cart.items[j].product.price * cart.items[j].quantity;
                subTotal += cart.items[j].totalPrice;
            }
            else if (cart.items[j].type === "SAMPLE")
            {
                cart.items[j].product.price = 0;
                cart.items[j].totalPrice = 0;
            }
            if (cart.items[j].type === "OFFER")
            {
                if ( !cart.items[j].offer || cart.items[j].offer.status==='EXPIRED' )
                {
                    carts[i].items.splice(j,1);
                    j--;
                    continue;
                }

                //Stock Change Check
                if ( cart.items[j].offer.quantity > cart.items[j].product.stock )
                {
                    cart.items.splice(j,1);
                    j--;
                    continue;
                }

                regularItems = true;
                cart.items[j].quantity = cart.items[j].offer.quantity;
                cart.items[j].totalPrice = cart.items[j].offer.price;

                subTotal += cart.items[j].totalPrice;
            }
        }

        if (cart.items.length === 0)
        {
            this.delCart(cart._id);
            return res.status(400).send("No Items in Cart");
        }
        else
        {
            this.updateItems(cart._id, cart.items);   
        }

        if ( cart.buyer.city === cart.seller.city )
        {
            cart.seller.deliveryCharge = cart.seller.sameCityDeliveryCharge;
        }
        else
        {
            cart.seller.deliveryCharge = cart.seller.diffCityDeliveryCharge;
        }

        if ( !regularItems )
        {
            cart.seller.deliveryCharge = 0;
        }

        cart.subTotal = subTotal;
        cart.total = subTotal + cart.seller.deliveryCharge;

        cart.advance = 0;
        cart.cashOnDelivery = cart.total;

        if (cart.seller.advancePayment === true)
        {
            console.log("ADVANCE PAYMENT TRUE")
            if ( cart.total >= cart.seller.advancePaymentCriteria )
            {
                cart.advance = Math.floor((cart.total/100)*cart.seller.advancePaymentAmount);
                cart.cashOnDelivery = cart.total - cart.advance;
            }
        }

        res.send(cart);
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Get Seller Payment Option for Checkout
module.exports.fetchSellerPaymentMethod = async(req,res) => {

    try
    {
        let cart = await Cart.findOne({buyer: req.buyer._id}).populate('seller');
        if(cart)
        {
            return res.send({onlinePaymentOption: cart.seller.onlinePaymentOption});
        }
        else
        {
            return res.status(400).send("Cart is Empty");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};


//_________________________________________________________________________
//                          Internal Functions
//_________________________________________________________________________

//Delete Cart after Order Placed
module.exports.delCart = async(cartID) => {

    try
    {
        await Cart.findByIdAndDelete(cartID);
        console.log("Cart Deleted");
        return;
    }
    catch(err)
    {
        console.log("Error Deleting Cart (Internal Func)");
        console.log(err);
        return;
    }
};

//Update Cart Items
module.exports.updateItems = async(cartID, items) => {

    try
    {
        await Cart.findByIdAndUpdate(cartID, {items: items});
        console.log("Cart Items Updated");
        return;
    }
    catch(err)
    {
        console.log("Error Updating Cart Items (Internal Func)");
        console.log(err);
        return;
    }
};

//Place Scheduled Order in Cart
module.exports.addScheduledOrder = async(buyerID, productID, quantity) => {

    try
    {
        let product = await productController.getDetails(productID);
        let buyer = await buyerController.getBuyerDetails(buyerID);
        if(!product)
        {
            console.log("Could not Add Scheduled Order to Cart Prod not exists");
            return;
        }

        let cart = await Cart.findOne({buyer: buyerID, seller: product.seller});
        // if(cart)
        // {
        //     this.delCart(cart._id);
        //     let id = new mongoose.Types.ObjectId();
        //     cart = await Cart.create({_id: id, buyer: buyerID, seller: product.seller});
        // }
        if(!cart)
        {
            let id = new mongoose.Types.ObjectId();
            cart = await Cart.create({_id: id, buyer: buyerID, seller: product.seller});
        }

        if( product.minOrder > product.stock)
        {
            Mailer.failedScheduledOrder(buyer.email, product.name, product.seller.storeName, quantity);
            console.log("Check Mailer 1")
            console.log("Could not Add Scheduled Order to Cart");
            return;
        }
        //Checking if Item already in Cart
        for(let i=0; i<cart.items.length; i++)
        {
            if(cart.items[i].product === product._id )
            {
                cart.items.splice(i,1);
                i--;
                continue;
            }
        }
        //If New Item
        if( quantity >= product.minOrder )
        {
            if( quantity <= product.stock )
            {
                cart.items.push({product: product._id, type: "DEFAULT", quantity: quantity});
            }
            else
            {
                cart.items.push({product: product._id, type: "DEFAULT", quantity: product.stock});
            }
        }
        else
        {
            cart.items.push({product: product._id, type: "DEFAULT", quantity: product.minOrder});
        }

        await Cart.findByIdAndUpdate(cart._id, { items: cart.items });
        
        Mailer.scheduledOrderAdded(buyer.email, product.name, product.seller.storeName, quantity )
        console.log("Check Mailer 2");
        console.log("Scheduled Order Added to Cart");
        return;
    }
    catch(err)
    {
        console.log("Error Adding Scheduled Order to Cart (Internal Func at Cart)");
        console.log(err);
        return;
    }
};
