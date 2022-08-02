const express = require('express');
const mongoose = require("mongoose");
const _ = require("lodash");

const { Transaction, validateWithdrawalDetails, validateWithdrawalResponse } = require("../models/transaction");
const sellerController = require("./sellers");


//_________________________________________________________________________
//                              Seller APIs
//_________________________________________________________________________

//Get Transactions for a Seller
module.exports.fetchSellerTransactions = async (req,res) => {

    try
    {
        let transactions = await Transaction.find({Seller: req.seller.id}, '-Buyer -Seller -Order -stripeTransactionID -accountDetails').sort({createdAt:-1});
        return res.send(transactions);
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Create a Withdrawal Request by Seller
module.exports.createWithdrawal = async (req,res) => {

    try
    {
        let { error } = validateWithdrawalDetails(req.body);
        if(error)
        {
            return res.status(400).send(error.details[0].message);
        }

        if (req.seller.hold=== true)
        {
            return res.status(400).send("Seller on Hold");
        }

        let transaction = await Transaction.findOne({Seller: req.seller._id, status: 'PENDING-WITHDRAWAL'});
        if (transaction)
        {
            return res.status(400).send("A Withdrawal Request is already Pending");
        }
        if ( req.body.amount > req.seller.balance )
        {
            return res.status(400).send("Your current balance is PKR. " + req.seller.balance );
        }
        
        transaction = new Transaction();

        transaction._id = new mongoose.Types.ObjectId();
        transaction.amount = Math.floor(req.body.amount*-1);
        transaction.Seller = req.seller._id;
        transaction.status = 'PENDING-WITHDRAWAL';
        transaction.accountDetails =  {
            accountNumber: req.seller.accountDetails.accountNumber,
            accountTitle: req.seller.accountDetails.accountTitle,
            bankTitle: req.seller.accountDetails.bankTitle
        }
        transaction.createdAt = new Date();
        transaction.requestedBy = 'SELLER';

        await transaction.save();

        return res.send("Withdrawal Requested");
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};


//_________________________________________________________________________
//                              Admin APIs
//_________________________________________________________________________

//Get Transactions for a Seller
module.exports.fetchAllTransactions = async (req,res) => {

    try
    {
        let transactions = [];
        if (req.params.status==='PENDING-WITHDRAWAL')
        {
            transactions = await Transaction.find({status: 'PENDING-WITHDRAWAL'}, 'stripeTransactionID amount status').sort({createdAt:-1});    
        }
        else if (req.params.status==='PENDING-REFUND')
        {
            transactions = await Transaction.find({status: 'PENDING-REFUND'}, 'stripeTransactionID amount status').sort({createdAt:-1});    
        }
        else
        {
            transactions = await Transaction.find({}, 'stripeTransactionID amount status').sort({createdAt:-1});
        }
        

        if (transactions.length===0)
        {
            return res.status(400).send("No Transactions");
        }
        return res.send(transactions);
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//fetch Transaction Details
module.exports.fetchDetails = async(req,res) => {

    try
    {
        let  transaction = await Transaction.findOne({_id: req.params.id})
        .populate('Buyer', 'email')
        .populate('Seller', 'storeName')
        .sort({createdAt:-1});

        if (!transaction)
        {
            return res.status(400).send("Transaction not found");
        }
        return res.send(transaction);
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Create a Withdrawal Request by Seller
module.exports.adminCreateWithdrawal = async (req,res) => {

    try
    {
        if (req.seller.hold=== true)
        {
            return res.status(400).send("Seller on Hold");
        }

        let transaction = await Transaction.findOne({Seller: req.seller._id, status: 'PENDING-WITHDRAWAL'});
        if (transaction)
        {
            return res.status(400).send("A Withdrawal Request is already Pending");
        }
        if ( req.body.amount <= 0 )
        {
            return res.status(400).send("Enter a valid Withdrawal Amount");
        }
        if ( req.body.amount > req.seller.balance )
        {
            return res.status(400).send("Current balance is PKR. " + req.seller.balance );
        }
        
        transaction = new Transaction();

        transaction._id = new mongoose.Types.ObjectId();
        transaction.amount = Math.floor(req.body.amount*-1);
        transaction.Seller = req.seller._id;
        transaction.status = 'PENDING-WITHDRAWAL';
        transaction.accountDetails =  {
            accountNumber: req.seller.accountDetails.accountNumber,
            accountTitle: req.seller.accountDetails.accountTitle,
            bankTitle: req.seller.accountDetails.bankTitle
        }
        transaction.createdAt = new Date();
        transaction.requestedBy = req.admin.name;

        await transaction.save();

        return res.send("Withdrawal Requested");
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Complete Withdrawal
module.exports.adminRespondWithdrawal = async (req,res) => {

    try
    {
        let transaction = await Transaction.findOne({_id: req.params.id, status: 'PENDING-WITHDRAWAL'});
        if (transaction)
        {
            if (req.body.status === 'ACCEPTED')
            {
                let seller = await sellerController.getSellerForWithdrawal(transaction.Seller);

                if (seller.hold=== true)
                {
                    return res.status(400).send("Seller on Hold");
                }

                const { status, adminComment, ...reqBody } = req.body;
                let { error } = validateWithdrawalResponse(reqBody);
                if(error)
                { 
                    return res.status(400).send(error.details[0].message);
                }

                sellerController.updateBalance(transaction.Seller, transaction.amount);

                await Transaction.findByIdAndUpdate(transaction._id, { stripeTransactionID: req.body.stripeTransactionID, status: 'WITHDRAWN', adminName: req.admin.name, adminComment: req.body.adminComment });

                return res.send("Withdrawal Completed");
            }
            else if (req.body.status === 'DENIED')
            {
                if (!req.body.adminComment)
                {
                    return res.status(400).send("Comment is required");
                }

                await Transaction.findByIdAndUpdate(transaction._id, { status: 'DENIED-WITHDRAWAL', adminName: req.admin.name, adminComment: req.body.adminComment });
                return res.send("Withdrawal Denied");
            }
            else
            {
                return res.status(400).send("Invalid Status");    
            }
        }
        else
        {
            return res.status(400).send("Transaction not found");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Complete Withdrawal
module.exports.adminRespondRefund = async (req,res) => {

    try
    {
        let transaction = await Transaction.findOne({_id: req.params.id, status: 'PENDING-REFUND'});
        if (transaction)
        {
            await Transaction.findByIdAndUpdate(transaction._id, { status: 'REFUNDED', adminName: req.admin.name });
            return res.send("Amount Refunded");
        }
        else
        {
            return res.status(400).send("Transaction not found");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Deduct Amount from Seller Account
module.exports.adminDeductAmount = async (req,res) => {

    try
    {
        if ( !req.body.amount )
        {
            return res.status(400).send("Enter Amount");
        }
        if ( req.body.amount<=0 )
        {
            return res.status(400).send("Enter Valid Amount");
        }
        if ( req.body.amount > req.seller.balance )
        {
            return res.status(400).send("Your current balance is PKR. " + req.seller.balance );
        }

        if (!req.body.reason)
        {
            return res.status(400).send("Please state reason");
        }

        transaction = new Transaction();

        transaction._id = new mongoose.Types.ObjectId();
        transaction.amount = Math.floor(req.body.amount*-1);
        transaction.Seller = req.seller._id;
        transaction.status = 'DEDUCTED';
        transaction.adminName = req.admin.name;
        transaction.adminComment = req.body.reason;
        transaction.createdAt = new Date();

        await transaction.save();

        sellerController.updateBalance(transaction.Seller, transaction.amount);

        return res.send("Amount Deducted");
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

//Create transaction for opOrder Stripe Payment
module.exports.createOrderTransaction = async (stripeTransactionID, orderID, totalAmount, sellerID, buyerID) => {

    try
    {

        console.log("transaction", sellerID);
        let transaction = new Transaction();

        transaction._id = new mongoose.Types.ObjectId();
        transaction.stripeTransactionID = stripeTransactionID;
        transaction.Order = orderID;
        transaction.amount = totalAmount;
        transaction.Seller = sellerID;
        transaction.Buyer = buyerID;
        transaction.status = 'DELIVERY-PENDING';
        transaction.createdAt = new Date();

        await transaction.save();

        return {transactionID: transaction._id};
    }
    catch(err)
    {
        console.log("Error at Create Transaction (Internal Func)")
        console.log(err);
        return;
    }
};

//Start Processing Online Order Transaction on Delivery
module.exports.updateOrderTransaction = async ( transactionID, status ) => {

    try
    {
        // if (status === 'COMPLETED')
        // {
        //     sellerController.updateBalance(transaction.Seller, transaction.amount);
        // }
        if (status === 'PROCESSING')
        {
            let newDate = new Date();
            let date = newDate.getDate();
            newDate.setDate(date+7);
            await Transaction.findByIdAndUpdate(transactionID, { status: "PROCESSING", holdTill: newDate });
        }
        else if ( status === "PENDING-REFUND" )
        {
            await Transaction.findByIdAndUpdate(transactionID, { status: "PENDING-REFUND" });
        }

        console.log("Updated Transaction");
        return;
    }
    catch(err)
    {
        console.log("Error at Updating Completed Transaction (Internal Func)")
        console.log(err);
        return;
    }
};

//End Processing of Transaction after 7 Days of Delivery
module.exports.concludeOrderTransaction = async () => {

    try
    {
        let nowDate = new Date();

        let transactions = await Transaction.find({ holdTill: {$lt: nowDate}, status: 'PROCESSING' });

        for (transaction of transactions)
        {
            await Transaction.findByIdAndUpdate(transaction._id, { status: 'COMPLETED' });
            sellerController.updateBalance(transaction.Seller, transaction.amount);
        }
        return;
    }
    catch(err)
    {
        console.log("Error at Updating Concluding Transaction (Internal Func)")
        console.log(err);
        return;
    }
}