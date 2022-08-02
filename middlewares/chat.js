const jwt = require("jsonwebtoken");
const config = require("config");
const mongoose = require("mongoose");

const { Chat } = require("../models/chat");


//Check Valid Chat ID for Message
module.exports.checkChat = async (req,res,next) => {

    try
    {
        let chat = await Chat.findById(req.params.id);
        
        if (!chat)
        {
            return res.status(400).send("Chat does not Exist");
        }
        else
        {
            req.chat = chat;
            next();
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Get or Create Chat to send Offer
module.exports.getChat = async (req,res,next) => {

    try
    {
        let chat = await Chat.findOne({ Buyer: req.buyer._id, Seller: req.product.seller });

        if (!chat)
        {
            let id = new mongoose.Types.ObjectId();
            chat = await Chat.create({_id: id, Buyer: req.buyer._id, Seller: req.product.seller});
        }

        await chat.populate('Seller', 'avatar storeName');
        req.chat = chat;
        next();
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Mark Chat as Read for Seller
module.exports.sellerReadUpdate = async (req,res,next) => {

    try
    {
        await Chat.findByIdAndUpdate(req.chat._id, {sellerRead: true});
        next();
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

////Mark Chat as Read for Buyer
module.exports.buyerReadUpdate = async (req,res,next) => {

    try
    {
        await Chat.findByIdAndUpdate(req.chat._id, {buyerRead: true});
        next();
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};
