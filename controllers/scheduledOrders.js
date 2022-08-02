const express = require('express');
const mongoose = require("mongoose");
const _ = require("lodash");

const { ScheduledOrder } = require("../models/scheduledOrder");
const cartController = require("./carts");
const productController = require("./products");
const Mailer = require("../utils/mailer");
const { now } = require('lodash');


//_________________________________________________________________________
//                          Buyer APIs
//_________________________________________________________________________

//Get Scheduled Orders by Buyer
module.exports.getByBuyer = async (req,res) => {

    try
    {
        let scheduledOrders = await ScheduledOrder.find({ Buyer: req.buyer._id }).populate('Product', 'name images minOrder');
        return res.status(200).send(scheduledOrders);
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Get Single Scheduled Order Details
module.exports.getSingleDetails = async (req,res) => {

    try
    {
        let scheduledOrder = await ScheduledOrder.findOne({ _id: req.params.id, Buyer: req.buyer._id }).populate('Product', 'minOrder stock');

        if(scheduledOrder)
        {
            return res.send(scheduledOrder);
        }
        else
        {
            return res.status(400).send("Scheduled Order does not Exist");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Schedule a Product
module.exports.add = async (req,res) => {

    try
    {
        let scheduledOrder = new ScheduledOrder();

        if( !req.body.quantity )
        {
            return res.status(400).send("Please include Quantity");
        }
        if (req.product.minOrder > req.product.stock )
        {
            return res.status(400).send("Product is Out of Stock");
        }
        if (req.body.quantity < req.product.minOrder )
        {
            return res.status(400).send("Minimum of " + req.product.minOrder + " items can be ordered");
        }
        if (req.body.quantity > req.product.stock )
        {
            return res.status(400).send("Current Stock is " + req.product.stock + " Pieces");
        }

        let scheduledTime = new Date(req.body.scheduledTime);
        let nowDate = new Date();
        console.log(scheduledTime);
        console.log(nowDate);
        if ( scheduledTime < nowDate )
        {
            return res.status(400).send("Invalid Date and Time");
        }

        scheduledOrder._id = new mongoose.Types.ObjectId();
        scheduledOrder.Buyer = req.buyer._id;
        scheduledOrder.Product = req.product._id;
        scheduledOrder.quantity = req.body.quantity;
        scheduledOrder.scheduledTime = scheduledTime;
        scheduledOrder.createdAt = nowDate;
        scheduledOrder.repeat = req.body.repeat;
    
        if ( req.body.repeat )
        {
            if ( req.body.repetitionType === "PRESET" )
            {
                if ( ScheduledOrder.schema.path('presetRepetition').enumValues.includes(req.body.presetRepetition) )
                {
                    scheduledOrder.repetitionType = 'PRESET';
                    scheduledOrder.presetRepetition = req.body.presetRepetition;
                }
                else
                {
                    return res.status(400).send("Select a Repetition Cycle");
                }
            }
            else if ( req.body.repetitionType === "CUSTOM" )
            {
                if ( req.body.customRepetition > 0 )
                {
                    scheduledOrder.repetitionType = 'CUSTOM';
                    scheduledOrder.customRepetition = req.body.customRepetition;
                }
                else
                {
                    return res.status(400).send("Enter a valid Repetition Cycle");
                }
            }
            else
            {
                return res.status(400).send("Select a Repetition Type");
            }
        }

        await scheduledOrder.save();
        return res.send("Order Scheduled");
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
    
};

//Edit a Scheduled Order
module.exports.edit = async (req,res) => {

    try
    {
        let scheduledOrder = await ScheduledOrder.findById(req.params.id)
        if (!scheduledOrder)
        {
            return res.status(400).send("Invalid ID");
        }

        let product = await productController.getDetails(scheduledOrder.Product);
        if (req.body.quantity < product.minOrder)
        {
            return res.status(400).send("Minimum of" + req.product.minOrder + "items can be ordered");
        }

        let scheduledTime = new Date(req.body.scheduledTime);
        let nowDate = new Date();
        if ( scheduledTime < nowDate )
        {
            return res.status(400).send("Invalid Date and Time");
        }

        scheduledOrder.quantity = req.body.quantity;
        scheduledOrder.scheduledTime = scheduledTime;
        scheduledOrder.repeat = req.body.repeat;
    
        if ( req.body.repeat )
        {
            if ( req.body.repetitionType === "PRESET" )
            {
                if ( ScheduledOrder.schema.path('presetRepetition').enumValues.includes(req.body.presetRepetition) )
                {
                    scheduledOrder.repetitionType = 'PRESET';
                    scheduledOrder.presetRepetition = req.body.presetRepetition;
                }
                else
                {
                    return res.status(400).send("Select a Repetition Cycle");
                }
            }
            else if ( req.body.repetitionType === "CUSTOM" )
            {
                if ( req.body.customRepetition > 0 )
                {
                    scheduledOrder.repetitionType = 'CUSTOM';
                    scheduledOrder.customRepetition = req.body.customRepetition;
                }
                else
                {
                    return res.status(400).send("Enter a valid Repetition Cycle");
                }
            }
            else
            {
                return res.status(400).send("Select a Repetition Cycle");
            }
        }

        await ScheduledOrder.findByIdAndUpdate(scheduledOrder._id, scheduledOrder);
        return res.send("Order Scheduled");
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Delete a Scheduled Order
module.exports.del = async (req,res) => {

    try
    {
        let scheduledOrder = await ScheduledOrder.findById(req.params.id)
        if (!scheduledOrder)
        {
            return res.status(400).send("Invalid ID");
        }
        await ScheduledOrder.findByIdAndDelete(req.params.id);
        return res.send("Scheduled Order Removed");
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Get Preset Repetition Array
module.exports.getPresetArray = async (req,res) => {

    try
    {
        let presetOptions = ScheduledOrder.schema.path('presetRepetition').enumValues;
        return res.send(presetOptions);
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Error Fetching Preset Options")
    }
}

//_________________________________________________________________________
//                       Internal Functions
//_________________________________________________________________________

//Check for Deleted Products and Remove Scheduled Order
module.exports.updateDeleted = async(productID, productName, storeName) =>  {

    try
    {
        let scheduledOrders = await ScheduledOrder.find({ Product: productID }).populate('Buyer', 'email');

        for (scheduledOrder of scheduledOrders)
        {
            await ScheduledOrder.findByIdAndDelete(scheduledOrder._id);
            await Mailer.deletedScheduledOrder(scheduledOrder.Buyer.email, productName, storeName, scheduledOrder.quantity, scheduledOrder.scheduledTime);
        }
        console.log("Removed Deleted Products ScheduledOrders")
    }
    catch(err)
    {
        console.log("Error Removing Deleted Products Scheduled Orders");
        console.log(err);
        return;
    }
};

//Add Scheduled Item to Cart
module.exports.addToCart = async() => {

    try
    {
        let nowDate = new Date();
        //console.log("Scheduled Orders addToCart Script Execution at " + nowDate);

        let scheduledOrders = await ScheduledOrder.find({ scheduledTime: {$lt: nowDate} }).populate('Buyer', 'email blocked');

        for ( scheduledOrder of scheduledOrders )
        {
            if(!scheduledOrder.Buyer.blocked)
            {
                await cartController.addScheduledOrder(scheduledOrder.Buyer._id, scheduledOrder.Product, scheduledOrder.quantity);
                
                if(scheduledOrder.repeat)
                {
                    if ( scheduledOrder.repetitionType === 'PRESET' )
                    {
                        if ( scheduledOrder.presetRepetition === 'WEEKLY' )
                        {
                            scheduledOrder.scheduledTime.setDate(scheduledOrder.scheduledTime.getDate()+7);
                            await ScheduledOrder.findByIdAndUpdate(scheduledOrder._id, { scheduledTime: scheduledOrder.scheduledTime });
                        }
                        else  if ( scheduledOrder.presetRepetition === 'FORTNIGHTLY' )
                        {
                            scheduledOrder.scheduledTime.setDate(scheduledOrder.scheduledTime.getDate()+14);
                            await ScheduledOrder.findByIdAndUpdate(scheduledOrder._id, { scheduledTime: scheduledOrder.scheduledTime });
                        }
                        else  if ( scheduledOrder.presetRepetition === 'MONTHLY' )
                        {
                            scheduledOrder.scheduledTime.setMonth(scheduledOrder.scheduledTime.getMonth()+1);
                            await ScheduledOrder.findByIdAndUpdate(scheduledOrder._id, { scheduledTime: scheduledOrder.scheduledTime });
                        }
                        else  if ( scheduledOrder.presetRepetition === 'BI-MONTHLY' )
                        {
                            scheduledOrder.scheduledTime.setMonth(scheduledOrder.scheduledTime.getMonth()+2);
                            await ScheduledOrder.findByIdAndUpdate(scheduledOrder._id, { scheduledTime: scheduledOrder.scheduledTime });
                        }
                        else  if ( scheduledOrder.presetRepetition === 'TRI-MONTHLY' )
                        {
                            scheduledOrder.scheduledTime.setMonth(scheduledOrder.scheduledTime.getMonth()+7);
                            await ScheduledOrder.findByIdAndUpdate(scheduledOrder._id, { scheduledTime: scheduledOrder.scheduledTime });
                        }
                        else
                        {
                            await ScheduledOrder.findByIdAndDelete(scheduledOrder._id);
                            console.log("Scheduled Order Removed after Completion");
                        }
                        console.log("Order Scheduled to Repeat");
                    }
                    else if ( scheduledOrder.repetitionType === 'CUSTOM' )
                    {
                        scheduledOrder.scheduledTime.setDate(scheduledOrder.scheduledTime.getDate()+scheduledOrder.customRepetition);
                        await ScheduledOrder.findByIdAndUpdate(scheduledOrder._id, { scheduledTime: scheduledOrder.scheduledTime });
                        console.log("Order Scheduled to Repeat");
                    }
                    else
                    {
                        await ScheduledOrder.findByIdAndDelete(scheduledOrder._id);
                        console.log("Scheduled Order Removed after Completion");
                    }
                }
                else
                {
                    await ScheduledOrder.findByIdAndDelete(scheduledOrder._id);
                    console.log("Scheduled Order Removed after Completion");
                }
            }
        }
    }
    catch(err)
    {
        console.log("Error Adding Scheduled Orders to Cart (Internal Func at SchedOrder Controller)");
        console.log(err);
        return;
    }
}