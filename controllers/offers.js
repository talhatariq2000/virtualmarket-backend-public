const express = require('express');
const mongoose = require("mongoose");
const _ = require("lodash");

const { Offer, validateOffer } = require("../models/offer");
const messageController = require("./messages");


//_________________________________________________________________________
//                              Buyer
//_________________________________________________________________________

module.exports.create = async (req,res) => {

    try
    {
        let { error } = validateOffer({quantity: req.body.quantity, price: req.body.price});
        if(error)
        {
            return res.status(400).send(error.details[0].message);
        }

        if ( req.body.quantity > req.product.stock )
        {
            return res.status(400).send("Current Stock is " + req.product.stock + " Pieces");
        }

        let offer = new Offer();
    
        
        offer._id = new mongoose.Types.ObjectId();
        offer.Product = req.product._id;
        offer.Buyer = req.buyer._id;
        offer.quantity = req.body.quantity;
        offer.price = req.body.price;
        offer.status = 'PENDING';
        offer.expiry = new Date();
        offer.expiry.setDate(offer.expiry.getDate()+1);

        offer.save();

        await messageController.sendOffer(offer._id, req.chat._id)

        return res.send("Offer Sent");
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//_________________________________________________________________________
//                              Seller
//_________________________________________________________________________

module.exports.react = async (req,res) => {

    try
    {
        let offer = await Offer.findById(req.params.id).populate('Product', 'seller');

        if (!offer)
        {
            return res.status(400).send("Offer Not Found");
        }
        if (offer.Product.seller != req.seller._id)
        {
            return res.status(400).send("Unauthorized");
        }

        if ( req.body.status === 'ACCEPT' && offer.status === 'PENDING' )
        {
            await Offer.findByIdAndUpdate(offer._id, {status: "ACCEPTED"});
            return res.send("Offer Accepted");
        }
        else if ( req.body.status === 'REFUSE' && offer.status === 'PENDING' )
        {
            await Offer.findByIdAndUpdate(offer._id, {status: "REFUSED"});
            return res.send("Offer Refused");
        }
        else
        {
            return res.status(400).send("Unauthorized");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//_________________________________________________________________________
//                              Internal Function
//_________________________________________________________________________

module.exports.updateExpired = async() => {

    try
    {
        let nowDate = new Date();
        await Offer.updateMany({ expiry: {$lt: nowDate} }, { status: "EXPIRED" });
    }
    catch(err)
    {
        console.log("Error Updating Expired Offer");
        console.log(err);
        return;
    }
};

//Update Added Offers
module.exports.updateAdded = async (offerID) => {

    try
    {
        await Offer.findByIdAndUpdate(offerID, {status: 'ADDED'});
        console.log("Offer Updated");
        return;
    }
    catch(err)
    {
        console.log("Error Updating Added Offer");
        console.log(err);
        return;
    }
};