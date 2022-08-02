const express = require('express');
const mongoose = require("mongoose");
const _ = require("lodash");

const { Warranty, validateInput } = require("../models/warranty");
const productController = require("./products");



//_________________________________________________________________________
//                          Buyer APIs
//_________________________________________________________________________


//Get all Warranties by Buyer
module.exports.getByBuyer = async (req,res) => {

    try
    {
        let warranties = [];
        if (req.params.status==='ACTIVE')
        {
            warranties = await Warranty.find({Buyer: req.buyer._id, status: {$nin: ["EXPIRED"]} }, '-events -Buyer -__v');
        }
        else if (req.params.status==='EXPIRED')
        {
            warranties = await Warranty.find({Buyer: req.buyer._id, status: 'EXPIRED'}, '-events -Buyer -__v');
        }
        

        if (warranties.length ===0)
        {
            return res.status(400).send("No Warranties");
        }
        return res.send(warranties);
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Buyer Request to Claim Warranty
module.exports.request = async (req,res) => {

    try
    {
        let { error } = validateInput({comment: req.body.comment});
        if(error)
        {
            return res.status(400).send(error.details[0].message);
        }

        let warranty = await Warranty.findOne({ _id: req.params.id, Buyer: req.buyer._id});
        if (warranty)
        {
            if (warranty.status === 'IN-WARRANTY' || warranty.status === 'REPAIRED' || warranty.status === 'REPLACED' || warranty.status === 'DENIED' || warranty.status === 'RETURNED' )
            {
                let nowDate = new Date();
                if (warranty.expiry > nowDate)
                {
                    warranty.events.push({ name: 'REQUESTED', comment: req.body.comment, date: new Date() });
                    await Warranty.findByIdAndUpdate(req.params.id, { buyerComment: req.body.comment, status: 'REQUESTED', events: warranty.events });
                    return res.send("Warranty Claim has been Requested");
                }
                else
                {
                    return res.status(400).send("Warranty has expired");    
                }
            }
            else
            {
                return res.status(400).send("Unauthorized");
            }
        }
        else
        {
            return res.status(400).send("Warranty not Found");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};


//_________________________________________________________________________
//                          Seller APIs
//_________________________________________________________________________

//['IN-WARRANTY', 'REQUESTED', 'REPAIRED', 'REPLACED', 'DENIED', 'PENDING', 'EXPIRED']

//Get Seller Warranties
module.exports.getBySeller = async (req,res) => {

    try
    {
        let warranties = [];
        
        if (req.params.status==='REQUESTED')
        {
            warranties = await Warranty.find({ Seller: req.seller._id, status: 'REQUESTED' }, 'productName Product quantity');
        }
        else if (req.params.status==='RESPONDED')
        {
            warranties = await Warranty.find({ Seller: req.seller._id, status: { $in: ['REPAIRED', 'REPLACED', 'DENIED', 'PENDING'] } }, 'productName Product quantity')
        }
        else if (req.params.status==='IN-WARRANTY')
        {
            warranties = await Warranty.find({ Seller: req.seller._id, status: 'IN-WARRANTY' }, 'productName Product quantity')
        }
        else if (req.params.status==='EXPIRED')
        {
            warranties = await Warranty.find({ Seller: req.seller._id, status: 'EXPIRED' }, 'productName Product quantity')
        }
        else if (req.params.status==='ALL')
        {
            warranties = await Warranty.find({ Seller: req.seller._id }, 'productName Product quantity')
        }

        if (warranties.length===0)
        {
            return res.status(400).send("No Warranties");
        }
        return res.send(warranties);
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Get all Warranties by Seller
module.exports.getBySellerDetail = async (req,res) => {

    try
    {

        let warranty = await Warranty.findOne({_id: req.params.id, Seller: req.seller._id }, '-createdAt -Buyer -Seller -expiry -__v')
        .populate({
            path : 'Order',
            select: 'buyerName buyerContact deliveryAddress deliveryCity',
            populate : {
                path : 'deliveryCity'
            }
        });

        if (!warranty)
        {
            return res.status(400).send("Warranty not found");
        }
        return res.send(warranty);
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Respond to Warranty Claim
module.exports.respond = async (req,res) => {

    try
    {
        let { error } = validateInput({comment: req.body.comment});
        if(error)
        {
            return res.status(400).send(error.details[0].message);
        }

        let warranty = await Warranty.findOne({ _id: req.params.id, Seller: req.seller._id });

        if( warranty )
        {
            if (warranty.status === 'REQUESTED')
            {
                if ( req.body.status === 'DENIED' )
                {
                    warranty.events.push({ name: 'DENIED',comment: req.body.comment, date: new Date() });
                    await Warranty.findByIdAndUpdate(req.params.id, { sellerComment: req.body.comment, status: 'PENDING', events: warranty.events });
                    return res.send("Submitted for Admin approval");
                }
                else if ( req.body.status === 'REPAIRED' || req.body.status === "REPLACED" || req.body.status === "RETURNED" )
                {
                    warranty.events.push({ name: req.body.status, comment: req.body.comment, date: new Date() });
                    await Warranty.findByIdAndUpdate(req.params.id, { sellerComment: req.body.comment, status: "PENDING", events: warranty.events });
                    return res.send("Warranty Updated");
                }
                else
                {
                    return res.status(400).send("Unauthorized");    
                }
            }
            else
            {
                return res.status(400).send("Unauthorized");    
            }
        }
        else
        {
            return res.status(400).send("Warranty not Found");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
}


//_________________________________________________________________________
//                          Admin APIs
//_________________________________________________________________________

module.exports.getAll = async (req,res) => {

    try
    {
        let warranties = [];
        
        if (req.params.status==='PENDING')
        {
            warranties = await Warranty.find({ status: 'PENDING' }, 'buyerName productName status').populate('Seller', 'storeName');
        }
        else if (req.params.status==='EXPIRED')
        {
            warranties = await Warranty.find({ status: 'EXPIRED' }, 'buyerName productName status').populate('Seller', 'storeName');
        }
        else if (req.params.status==='ALL')
        {
            warranties = await Warranty.find({}, 'buyerName productName status').populate('Seller', 'storeName');
        }

        if (warranties.length===0)
        {
            return res.status(400).send("No Warranties");
        }
        return res.send(warranties);
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Get all Warranties by Seller
module.exports.getCompleteDetail = async (req,res) => {

    try
    {

        let warranty = await Warranty.findOne({_id: req.params.id })
        .populate('Buyer', 'email')
        .populate('Seller', 'storeName')
        .populate({
            path : 'Order',
            select: 'buyerName buyerContact deliveryAddress deliveryCity',
            populate : {
                path : 'deliveryCity'
            }
        });

        if (!warranty)
        {
            return res.status(400).send("Warranty not found");
        }
        return res.send(warranty);
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Respond to Warranty Claim
module.exports.adminResponse = async (req,res) => {

    try
    {
        console.log(req.body);
        let { error } = validateInput({comment: req.body.comment});
        if(error)
        {
            return res.status(400).send(error.details[0].message);
        }

        let warranty = await Warranty.findOne({ _id: req.params.id });

        if( warranty )
        {
            if (warranty.status === 'PENDING')
            {
                if ( req.body.status === 'DENIED' || req.body.status === 'REPLACED' || req.body.status === 'REPAIRED' || req.body.status === 'RETURNED' )
                {
                    warranty.events.push({ name: req.body.status, comment: req.body.comment, date: new Date() });
                    await Warranty.findByIdAndUpdate(req.params.id, { adminComment: req.body.comment, status: req.body.status, events: warranty.events });
                    return res.send("Warranty Updated");
                }
                else if ( req.body.status === 'REQUESTED' )
                {
                    warranty.events.push({ name: 'REQUESTED', comment: req.body.comment, date: new Date() });
                    await Warranty.findByIdAndUpdate(req.params.id, { adminComment: req.body.comment, status: 'REQUESTED', events: warranty.events });
                    return res.send("Warranty Updated");
                }
                else
                {
                    return res.status(400).send("Unauthorized");    
                }
            }
            else
            {
                return res.status(400).send("Unauthorized");    
            }
        }
        else
        {
            return res.status(400).send("Warranty not Found");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
}

//_________________________________________________________________________
//                          Internal Functions
//_________________________________________________________________________

//Add a Warranty
module.exports.add = async (buyerID, productID, orderID, quantity) => {

    try
    {
        let productDetails = await productController.getDetails(productID);

        warranty = new Warranty();

        warranty.createdAt = new Date();
        warranty._id = new mongoose.Types.ObjectId();
        warranty.Buyer = buyerID;
        warranty.Product = productID;
        warranty.Seller = productDetails.seller;
        warranty.productName = productDetails.name;
        warranty.Order = orderID;
        warranty.quantity = quantity;
        warranty.status = 'IN-WARRANTY';
        warranty.events.push({
            name: 'IN-WARRANTY',
            date: warranty.createdAt
        })

        warranty.expiry = new Date(warranty.createdAt);
        let nowDate = warranty.expiry.getDate();
        warranty.expiry.setDate( nowDate + productDetails.warrantyPeriod );

        await warranty.save();
        console.log("Warranty Added for" + productID);
        return;
    }
    catch(err)
    {
        console.log("Error Adding Warranty for" + productID);
        console.log(err);
        return;
    }
};

//Update Expired Warranties
module.exports.updateExpired = async() => {

    try
    {
        let nowDate = new Date();
        console.log("Update Expired Warranties Script Execution at " + nowDate);
        await Warranty.updateMany(
            { expiry: {$lt: nowDate}, status: { $nin: ['REQUESTED', 'PENDING', 'EXPIRED'] } }, 
            { status: "EXPIRED", $push: { events: {name: 'EXPIRED', date: nowDate} } });
        console.log("Expired Warranties Updated");
        return;
    }
    catch(err)
    {
        console.log("Error Updating Expired Warranties");
        console.log(err);
        return;
    }
};