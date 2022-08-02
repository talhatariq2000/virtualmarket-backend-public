const express = require('express');
const mongoose = require("mongoose");
const _ = require("lodash");

const { Chat } = require("../models/chat");

//_________________________________________________________________________
//                              Buyer APIs
//_________________________________________________________________________

//Initiate or Open a Chat with Seller
module.exports.initiate = async (req,res) => {

    try
    {
        let chat = await Chat.findOne({ Buyer: req.buyer._id, Seller: req.body.seller });

        if (!chat)
        {
            let id = new mongoose.Types.ObjectId();
            chat = await Chat.create({_id: id, Buyer: req.buyer._id, Seller: req.body.seller});
        }

        await chat.populate('Seller', 'avatar storeName');
        return res.status(200).send(chat);
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Get Chats
module.exports.getBuyerChats = async (req,res) => {

    try
    {
        let chats = await Chat.find({ Buyer: req.buyer._id }).populate('Seller', 'avatar storeName').sort({'lastUpdated': -1});

        for (i=0;i<chats.length;i++)
        {
            if ( !chats[i].lastMessage )
            {
                await Chat.findByIdAndDelete(chats[i]._id);
                chats.splice(i,1);
                i--;
            }
        }

        if (chats.length===0)
        {
            return res.status(400).send("No Chats");
        }

        return res.send(chats);
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

//Get Chats
module.exports.getSellerChats = async (req,res) => {

    try
    {
        let chats = await Chat.find({ Seller: req.seller._id }).populate('Buyer', 'avatar fName lName').sort({'lastUpdated': -1});

        for (i=0;i<chats.length;i++)
        {
            if ( !chats[i].lastMessage )
            {
                await Chat.findByIdAndDelete(chats[i]._id);
                chats.splice(i,1);
                i--;
            }
        }

        if (chats.length===0)
        {
            return res.status(400).send("No Chats Found");
        }

        return res.send(chats);
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

//Update Chat for new Message
module.exports.updateChat = async (sender, chatID, message) => {

    try
    {
        if ( sender === 'BUYER' )
        {
            await Chat.findByIdAndUpdate(chatID, { lastUpdated: new Date(), lastMessage: message, buyerRead: true, sellerRead: false });
        }
        else if ( sender === 'SELLER' )
        {
            await Chat.findByIdAndUpdate(chatID, { lastUpdated: new Date(), lastMessage: message, buyerRead: false, sellerRead: true });
        }
        
        return;
    }
    catch(err)
    {
        console.log("Error Updating Chat");
        console.log(err);
        return;
    }
}