const express = require('express');
const mongoose = require("mongoose");
const _ = require("lodash");

const cloudinary = require("../utils/cloudinary");

const { Message, validateContent } = require("../models/message");
const chatController = require("./chats");


//_________________________________________________________________________
//                              Buyer APIs
//_________________________________________________________________________

//Get Messages
module.exports.getMessages = async (req,res) => {

    try
    {
        let messages = await Message.find({ Chat: req.chat._id }).populate({ path : 'Offer', populate : {path : 'Product', select: 'name images brand'}});

        if (messages.length===0)
        {
            return res.status(400).send("No Chats Found");
        }

        return res.send(messages);
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Send a Message
module.exports.sendText = async (req,res) => {

    try
    {
        let { error } = validateContent({content: req.body.content});
        if(error)
        {
            return res.status(400).send(error.details[0].message);
        }

        let message = new Message();

        message._id = new mongoose.Types.ObjectId();
        message.sender = 'BUYER';
        message.Chat = req.chat._id;
        message.type = 'TEXT';
        message.content = req.body.content;
        message.Offer = 'NA';

        await message.save();
        chatController.updateChat('BUYER', req.chat._id, message.content )

        return res.send("Message Sent");
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Send an Image
module.exports.sendImage = async (req,res) => {

    try{

        var result;
        try
        {
            result = await cloudinary.uploader.upload(req.file.path);
        }
        catch
        {
            console.log(err);
            return res.status(400).send("Please Select a Valid Image")
        }

        let message = new Message();

        message._id = new mongoose.Types.ObjectId();
        message.sender = 'BUYER';
        message.Chat = req.chat._id;
        message.type = 'IMAGE';
        message.content = result.secure_url;
        message.Offer = 'NA';

        await message.save();
        chatController.updateChat('BUYER', req.chat._id, 'Image' )

        return res.send("Image Sent");
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

//Send a Message
module.exports.replyText = async (req,res) => {

    try
    {
        console.log(req.body);
        let { error } = validateContent({content: req.body.content});
        if(error)
        {
            return res.status(400).send(error.details[0].message);
        }

        let message = new Message();

        message._id = new mongoose.Types.ObjectId();
        message.sender = 'SELLER';
        message.Chat = req.chat._id;
        message.type = 'TEXT';
        message.content = req.body.content;
        message.Offer = 'NA';

        await message.save();
        chatController.updateChat('SELLER', req.chat._id, message.content )

        return res.send("Message Sent");
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Send an Image
module.exports.replyImage = async (req,res) => {

    try{

        var result;
        try
        {
            result = await cloudinary.uploader.upload(req.file.path);
        }
        catch
        {
            return res.status(400).send("Please Select a Valid Image")
        }

        let message = new Message();

        message._id = new mongoose.Types.ObjectId();
        message.sender = 'SELLER';
        message.Chat = req.chat._id;
        message.type = 'IMAGE';
        message.content = result.secure_url;
        message.Offer = 'NA';

        await message.save();
        chatController.updateChat('SELLER', req.chat._id, 'Image' )

        return res.send("Image Sent");
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

//Send an Offer
module.exports.sendOffer = async (offerID, chatID) => {

    try
    {
        let message = new Message();

        message._id = new mongoose.Types.ObjectId();
        message.sender = 'BUYER';
        message.Chat = chatID;
        message.type = 'OFFER';
        message.Offer = offerID;

        await message.save();
        chatController.updateChat('BUYER', chatID, 'Offer' )

        return;
    }
    catch(err)
    {
        console.log("Error Sending Message");
        console.log(err);
        return;
    }
};