const express = require('express');
const mongoose = require("mongoose");
const _ = require("lodash");
const dotenv = require("dotenv").config();
const stripe = require('stripe')(process.env.STRIPE_KEY)

const { Order, validateBuyerData } = require("../models/order");
const cartController = require("./carts");
const warrantyController = require("./warranties");
const productController = require('./products');
const transactionController = require('./transactions');
const sellerController = require('./sellers');

const Mailer = require("../utils/mailer");


//_________________________________________________________________________
//                              Buyer APIs
//_________________________________________________________________________

//Cash on Delivery Checkout
module.exports.codCheckout = async (req,res) => {

    try
    {
        let { error } = validateBuyerData(req.body);
        if(error)
        {
            return res.status(400).send(error.details[0].message);
        }

        //Entering Order Details
        let order = new Order();

        order._id = new mongoose.Types.ObjectId();
        order.Buyer = req.buyer._id;
        order.Seller = req.cart.seller;

        order.buyerName = req.body.name;
        order.buyerContact = req.body.phone;
        order.deliveryAddress = req.body.address;
        order.deliveryCity = req.body.city;
        order.deliveryCharge = req.cart.seller.deliveryCharge;

        order.status = 'PLACED';
        order.createdAt = new Date();
        order.events.push({ name: 'PLACED', date: new Date() });
        order.type = 'Cash-On-Delivery';

        //Placing Cart Items in Order
        for (item of req.cart.items)
        {
            productController.updateStock(item.product._id, item.quantity*-1);
            order.items.push({
                productName: item.product.name,
                Product: item.product._id,
                type: item.type,
                quantity: item.quantity,
                totalPrice: item.totalPrice
            });
        }

        await order.save();
        await cartController.delCart(req.cart._id);
        Mailer.updatedOrder(order._id, req.buyer.email, req.cart.seller.storeName, "Placed");
        return res.send("Order Placed");
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Online Payment Checkout
module.exports.opCheckout = async (req,res) => {

    try
    {
        if (!req.cart.seller.onlinePaymentOption)
        {
            return res.status(400).send("This seller does not accept Online Payment");
        }
        
        let { error } = validateBuyerData({name: req.body.name, address: req.body.address, phone: req.body.phone, city: req.body.city});
        if(error)
        {
            console.log(error);
            return res.status(400).send(error.details[0].message);
        }

        if (!req.body.id)
        {
            return res.status(400).send("Stripe Payment id Error");
        }

        //Entering Order Details
        let order = new Order();

        order._id = new mongoose.Types.ObjectId();

        //Conducting Stripe Payment
        var payment;
        try
        {
            payment = await stripe.paymentIntents.create({
                amount: req.cart.total*100,
                currency: "PKR",
                description: "ONLINE-PAYMENT - " + "Order ID: " + order._id + " From Buyer: " + req.cart.buyer + " To Seller: " + req.cart.seller._id,
                payment_method: req.body.id,
                confirm: true
            });
        }
        catch(err)
        {
            console.log("Stripe Payment Failed", err);
		    return res.status(400).send("Payment Failed");
        }

        let transaction = await transactionController.createOrderTransaction(payment.id, order._id, req.cart.total, req.cart.seller._id, req.buyer._id);
        if (!transaction)
        {
            return res.status(500).send("Failed to create Transaction");
        }

        order.Buyer = req.buyer._id;
        order.Seller = req.cart.seller;

        order.buyerName = req.body.name;
        order.buyerContact = req.body.phone;
        order.deliveryAddress = req.body.address;
        order.deliveryCity = req.body.city;
        order.deliveryCharge = req.cart.seller.deliveryCharge;

        order.status = 'PLACED';
        order.createdAt = new Date();
        order.events.push({ name: 'PLACED', date: new Date() });
        order.type = 'ONLINE-PAYMENT';
        order.Transaction = await transaction.transactionID;

        //Placing Cart Items in Order
        for (item of req.cart.items)
        {
            productController.updateStock(item.product._id, item.quantity*-1);
            order.items.push({
                productName: item.product.name,
                Product: item.product._id,
                type: item.type,
                quantity: item.quantity,
                totalPrice: item.totalPrice
            });
        }

        await order.save();
        await cartController.delCart(req.cart._id);
        return res.send("Order Placed");
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Advance Payment Checkout
module.exports.checkout = async (req,res) => {

    try
    {
        console.log("req.quantities", req.quantites);
        let { error } = validateBuyerData({name: req.body.name, address: req.body.address, phone: req.body.phone, city: req.body.city});
        if(error)
        {
            productController.addStockforFailure(req.quantites);
            return res.status(400).send(error.details[0].message);
        }

        //Entering Order Details
        let order = new Order();

        order._id = new mongoose.Types.ObjectId();

        //Conducting Stripe Payment
        var payment;
        if (parseInt(req.body.advanceAmount)>0 || req.cart.advance>0 )
        {
            if ( req.cart.seller.onlinePaymentOption===true )
            {
                if ( parseInt(req.body.advanceAmount) >= req.cart.advance )
                {
                    if ( parseInt(req.body.advanceAmount) > req.cart.total )
                    {
                        console.log(parseInt(req.body.advanceAmount), req.cart.total);
                        productController.addStockforFailure(req.quantites);
                        return res.status(400).send("Advance Payment cannot be more than Total Amount");
                    }
                    if (!req.body.id)
                    {
                        productController.addStockforFailure(req.quantites);
                        return res.status(400).send("Stripe Payment id Error");
                    }
                    try
                    {
                        payment = await stripe.paymentIntents.create({
                            amount: parseInt(req.body.advanceAmount)*100,
                            currency: "PKR",
                            description: "ADVANCE PAYMENT - " + "Order ID: " + order._id + " From Buyer: " + req.cart.buyer + " To Seller: " + req.cart.seller._id,
                            payment_method: req.body.id,
                            confirm: true
                        });
                    }
                    catch(err)
                    {
                        console.log("Stripe Payment Failed", err);
                        productController.addStockforFailure(req.quantites);
		                return res.status(400).send("Advance Payment Error: " + err.raw.message);
                    }
                }
                else
                {
                    productController.addStockforFailure(req.quantites);
                    return res.status(400).send("Advance Payment is PKR." + req.cart.advance);
                }
            }
            else
            {
                productController.addStockforFailure(req.quantites);
                return res.status(400).send("This seller does not accept Online Advance Payment");
            }
        }

        if (payment)
        {
            let transaction = await transactionController.createOrderTransaction(payment.id, order._id, parseInt(req.body.advanceAmount), req.cart.seller._id, req.buyer._id);
            if (!transaction)
            {
                return res.status(500).send("Failed to create Transaction");
            }
            order.Transaction = transaction.transactionID;
        }
        
        order.Buyer = req.buyer._id;
        order.Seller = req.cart.seller;

        order.buyerName = req.body.name;
        order.buyerContact = req.body.phone;
        order.deliveryAddress = req.body.address;
        order.deliveryCity = req.body.city;

        order.deliveryCharge = req.cart.seller.deliveryCharge;
        order.total = req.cart.total;
        order.advance = parseInt(req.body.advanceAmount);
        order.cashOnDelivery = req.cart.total - parseInt(req.body.advanceAmount);

        order.status = 'PLACED';
        order.createdAt = new Date();
        order.events.push({ name: 'PLACED', date: new Date() });

        order.specialInstructions = req.body.specialInstructions;

        //Placing Cart Items in Order
        for (item of req.cart.items)
        {
            //productController.updateStock(item.product._id, item.quantity*-1);
            order.items.push({
                productName: item.product.name,
                Product: item.product._id,
                type: item.type,
                quantity: item.quantity,
                totalPrice: item.totalPrice
            });
        }

        await order.save();
        await cartController.delCart(req.cart._id);
        Mailer.updatedOrder(order._id, req.buyer.email, req.cart.seller.storeName, "Placed");
        sellerController.newOrderEmail(order.Seller);
        return res.send("Order Placed");
    }
    catch(err)
    {
        console.log(err);
        productController.addStockforFailure(req.quantites);
        return res.status(500).send("Internal Server Error");
    }
};

//Fetch Seller Orders with Details
module.exports.fetchBuyerOrders = async (req,res) => {

    try
    {
        let orders = await Order.find({ Buyer: req.buyer._id }, 'status createdAt').populate('Seller', 'storeName').sort({'createdAt': -1}).lean();

        if ( orders.length === 0 )
        {
            return res.status(400).send("No Orders Yet");    
        }
        return res.send(orders);
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Fetch Seller Orders with Details
module.exports.fetchBuyerOrderDetails = async (req,res) => {

    try
    {
        let order = await Order.findOne({_id: req.params.id, Buyer: req.buyer._id }).populate('Seller', 'storeName').populate('deliveryCity').sort({'createdAt': -1}).lean();

        if(order)
        {
            order.subTotal = order.total-order.deliveryCharge;
            return res.send(order);    
        }
        else
        {
            return res.status(400).send("Order not found");    
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Cancel Order before Packaging
module.exports.cancel = async (req,res) => {

    try
    {
        let order = await Order.findOne({ Buyer: req.buyer._id, _id: req.params.id }).populate('Buyer', 'name email').populate('Seller', 'storeName');
        if (!order)
        {
            return res.status(400).send("Order not found");
        }
        else
        {
            if ( order.status === 'PLACED' )
            {
                for (item of order.items)
                {
                    productController.updateStock(item.Product, item.quantity);
                }
                order.events.push({ name: 'CANCELLED', date: new Date() });
                await Order.findByIdAndUpdate(order._id, { status: 'CANCELLED', events: order.events });
                Mailer.concludedOrder(order._id, order.Buyer.email, order.Seller.storeName, "Cancelled", "");
                if (order.advance > 0)
                {
                    transactionController.updateOrderTransaction(order.Transaction, "PENDING-REFUND");
                }
                return res.send("Order Cancelled");
            }
            return res.send("Unauthorized");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//_________________________________________________________________________
//                              Seller APIs
//_________________________________________________________________________

//Fetch Seller Orders with Details
module.exports.fetchSellerOrders = async (req,res) => {

    try
    {
        let orders = await Order.find({ Seller: req.seller._id, status: req.params.status }, 'status createdAt').populate('deliveryCity').lean();

        // for (order of orders)
        // {
        //     order.subTotal = 0;
        //     order.total = 0;

        //     for (item of order.items)
        //     {
        //         order.subTotal += item.totalPrice; 
        //     }
        //     order.total = order.subTotal + order.deliveryCharge;
        // }
        if (orders.length === 0)
        {
            return res.status(400).send("No Orders");
        }
        return res.send(orders);
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Fetch Single Order Details
module.exports.fetchOrderDetails = async (req,res) => {

    try
    {
        let order = await Order.findOne({ Seller: req.seller._id, _id: req.params.id }).populate('deliveryCity').lean();
        
        if(order)
        {
            order.subTotal = order.total-order.deliveryCharge;
            return res.send(order);    
        }
        else
        {
            return res.status(400).send("Order not found");    
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Change Status of Order (Placed -> Packaging -> Shipping)
module.exports.changeStatus = async (req,res) => {


    try
    {
        let values = await Order.schema.path('status').enumValues;
        let order = await Order.findOne({ Seller: req.seller._id, _id: req.params.id }).populate('Buyer', 'name').populate('Seller', 'storeName');
        if (!order)
        {
            return res.status(400).send("Order not found");
        }
        else
        {
            if ( order.status === 'PLACED' )
            {
                order.events.push({ name: 'PACKAGING', date: new Date() });
                await Order.findByIdAndUpdate(order._id, { status: 'PACKAGING', events: order.events });
                return res.send("Order Updated");
            }
            else if ( order.status === 'PACKAGING' )
            {
                order.events.push({ name: 'SHIPPING', date: new Date() });
                await Order.findByIdAndUpdate(order._id, { status: 'SHIPPING', events: order.events });
                Mailer.updatedOrder(order._id, order.Buyer.email, order.Seller.storeName, "Shipped");
                return res.send("Order Updated");
            }
            return res.send("Order could not be updated");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Change Order Status to Delivered/Returned
module.exports.concludeOrder = async (req,res) => {

    try
    {
        let order = await Order.findOne({ Seller: req.seller._id, _id: req.params.id }).populate('Buyer', 'name email').populate('Seller', 'storeName');
        if (!order)
        {
            return res.status(400).send("Order not found");
        }
        else
        {
            if ( order.status === 'SHIPPING' )
            {
                if ( req.body.status === 'DELIVERED' )
                {
                    order.events.push({ name: 'DELIVERED', date: new Date() });
                    //Adding Delivered Items to Warranty List
                    for ( item of order.items )
                    {
                        if ( item.type === "DEFAULT" || item.type === "OFFER" )
                        {
                            await warrantyController.add(order.Buyer, item.Product, order._id, item.quantity);
                        }
                    }
                    await Order.findByIdAndUpdate(order._id, { status: 'DELIVERED', events: order.events });
                    
                    if (order.advance>0)
                    {
                        transactionController.updateOrderTransaction(order.Transaction, "PROCESSING");
                    }
                    
                    Mailer.concludedOrder(order._id, order.Buyer.email, order.Seller.storeName, "Delivered", "Make sure to Review your Ordered Items through the Order Page.");
                    return res.send("Order Updated");
                }
                // else if ( req.body.status === 'RETURNED' )
                // {
                //     for (item of order.items)
                //     {
                //         productController.updateStock(item.Product, item.quantity);
                //     }
                    

                //     order.events.push({ name: 'RETURNED', date: new Date() });
                //     await Order.findByIdAndUpdate(order._id, { status: 'RETURNED', events: order.events });
                    
                //     Mailer.concludedOrder(order._id, order.Buyer.email, order.Seller.storeName, "Returned", "");
                    
                //     if (order.type === 'ONLINE-PAYMENT')
                //     {
                //         transactionController.updateOrderTransaction(order.Transaction, "PENDING-RETURN");
                //     }
                //     return res.send("Order Updated");
                // }
            }
            return res.status(400).send("Could not update order");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Get Seller New Orders Count
module.exports.getOrdersCount = async (req,res) => {

    try
    {
        let newOrders = await Order.find({ Seller: req.seller._id, status: 'PLACED' }).lean();
        const newOrdersCount = newOrders.length;

        let pendingOrders = await Order.find({ Seller: req.seller._id, status: { $in: ['PACKAGING', 'SHIPPING'] } }).lean();
        const pendingOrdersCount = pendingOrders.length;

        let completedOrders = await Order.find({ Seller: req.seller._id, status: 'DELIVERED' }).lean();
        const completedOrdersCount = completedOrders.length;
        
        return res.send({ newOrders: newOrdersCount, pendingOrders: pendingOrdersCount, completedOrders: completedOrdersCount });
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Get Products for Dashboard
module.exports.getMonthlyOrders = async (req,res) => {

    try
    {
        let values = [];
        let nowDate = new Date();

        for (i=0;i<6;i++)
        {
            let newDate = new Date();
            newDate.setMonth(newDate.getMonth()-i);
            console.log("newDate", newDate)

            let endDate = new Date(newDate);
            endDate.setDate(28);
            //console.log("endDate", endDate)

            let startDate = new Date(newDate);
            startDate.setDate(1);
            //console.log("startDate", startDate)

            //Getting Month Names
            let name = newDate.toLocaleString('default', { month: 'short' }) + " " + newDate.getFullYear();
            console.log("name", name)

            //Getting New Sellers in the month
            let monthlyOrders = await Order.countDocuments({Seller: req.seller._id, createdAt: { $lte: endDate, $gte: startDate }, status: { $nin: ['CANCELLED'] }}); 
            console.log("monthlyOrders", monthlyOrders)

            values.push({
                name: name,
                Orders: monthlyOrders
            })
        }

        console.log(values);

        return res.send(values.reverse());
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
}

//_________________________________________________________________________
//                              Admin APIs
//_________________________________________________________________________

//Fetch All Order List
module.exports.fetchAllOrders = async (req,res) => {

    try
    {
        let orders = [];
        if(req.params.status==='ALL')
        {
            orders = await Order.find({}, 'status').populate('Seller', 'storeName').lean();
        }
        else
        {
            orders = await Order.find({ status: req.params.status }, 'status').populate('Seller', 'storeName').lean();
        }
        

        if (orders.length === 0)
        {
            return res.status(400).send("No Orders");
        }
        return res.send(orders);
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Fetch One Order Complete Details
//Fetch Single Order Details
module.exports.fetchOrderCompleteDetails = async (req,res) => {

    try
    {
        let order = await Order.findOne({ _id: req.params.id }).populate('Seller', 'storeName').populate('deliveryCity').lean();
        
        if(order)
        {
            order.subTotal = order.total-order.deliveryCharge;
            return res.send(order);    
        }
        else
        {
            return res.status(400).send("Order not found");    
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//_________________________________________________________________________
//                              Internal Functions
//_________________________________________________________________________

//Update Reviewed Item
module.exports.updateReviewed = async (orderID, itemID, reviewID) => {

    try
    {
        await Order.findOneAndUpdate({_id: orderID, "items._id": itemID}, {"items.$.reviewed": true, "items.$.Review": reviewID });
        return;
    }
    catch(err)
    {
        console.log(err);
        return;
    }
};

//Update Blocked Seller Products
module.exports.updateBlocked = async (sellerID) => {
 
    try
    {
        let orders = await Order.find({ Seller: sellerID, status: {$nin: ['DELIVERED', 'CANCELLED']} }).populate('Buyer', 'email').populate('Seller', 'storeName');
        for (order of orders)
        {
            if (order.advance > 0)
            {
                transactionController.updateOrderTransaction(order.Transaction, "PENDING-REFUND");
            }
            order.events.push({ name: 'CANCELLED', date: new Date() });
            Mailer.concludedOrder(order._id, order.Buyer.email, order.Seller.storeName, "Cancelled", "");
            await Order.findByIdAndUpdate(order._id, { status: 'CANCELLED', events: order.events });
        }
        console.log("Orders Cancelled");
        return;
    }
    catch(err)
    {
        console.log('Error Updating Blocked Seller Orders (Internal Func)');
        console.log(err);
        return;
    }
};