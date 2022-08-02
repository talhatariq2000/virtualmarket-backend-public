const express = require('express');
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const config = require("config");
const fs = require('fs');
const dotenv = require("dotenv").config();

var { Seller, validateSellerSignup, validateSellerLogin, validateSellerAddDetails, validateSellerEditDetails, validateSellerChangeStatus, validateAccountDetails, validateAdvancePayment, validateSellerHold } = require("../models/seller");

var Mailer = require("../utils/mailer");
const cloudinary = require("../utils/cloudinary");
const productController = require("./products");
const orderController = require("./orders");

const Mail = require('nodemailer/lib/mailer');
const { now } = require('lodash');


//________________________________________________________________________________
//                            Logged-Out Seller
//________________________________________________________________________________

//Create New Seller Account
module.exports.createSeller = async (req,res) => {
    
    try
    {
        let { error } = validateSellerSignup(req.body);
        if(error)
        {
            console.log(error);
            return res.status(400).send(error.details[0].message);
        }

        let seller = await Seller.findOne({email:req.body.email.toLowerCase()});
        if (seller)
        {
            return res.status(400).send("Email already in use");
        }
        else
        {
            if(req.body.password === req.body.confirmPassword)
            {
                seller = new Seller();

                seller._id = new mongoose.Types.ObjectId();
                seller.email = req.body.email.toLowerCase();
                seller.status = 'NEW';
                seller.createdAt = new Date();
                seller.events.push({date: seller.createdAt, name: 'Account Created'});
                seller.avatar.link = 'https://res.cloudinary.com/ddpdr9nvh/image/upload/v1647162487/blankProfilePic_gbdntn.png';

                let salt = await bcrypt.genSalt(5);
                seller.password = await bcrypt.hash(req.body.password, salt);
            }
            else
            {
                return res.status(400).send("Password and Confirm Password Mismatch")
            }

            await seller.save();
            return res.status(201).send("Account Created");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(400).send("Internal Server Error");        
    }
};

//Login Seller
module.exports.loginSeller = async (req,res) => {

    let { error } = validateSellerLogin(req.body);
    if(error)
    {
        return res.status(400).send(error.details[0].message);
    }

    let seller = await Seller.findOne({email:req.body.email.toLowerCase()});

    if (!seller)
    {
        return res.status(400).send("Email not registered");
    }
    else
    {
        let isValid = await bcrypt.compare( req.body.password, seller.password);
        if(!isValid)
        {
            return res.status(401).send("Invalid Password");
        }
        else
        {
            try{
                let token = jwt.sign( {_id: seller._id, email: seller.email}, process.env.JWT_SECRET_KEY);
                console.log(token);
                return res.status(202).send(token);
            }
            catch(err){
                return res.status(400).send(err.message);
            }
        }
    }

};

//generate OTP for forgot password(User not logged in)
module.exports.forgotPasswordOTP = async (req,res) => {

    let seller = await Seller.findOne({email:req.body.email.toLowerCase()});

    if(seller)
    {
        let newOTP = Math.floor((Math.random()*10000)+1).toString();
        let newOTPExpiry = new Date();
        let nowMinutes = newOTPExpiry.getMinutes();
        newOTPExpiry.setMinutes(nowMinutes+5);

        await Seller.findByIdAndUpdate(seller._id, {otp: newOTP, otpExpiry: newOTPExpiry});
        Mailer.forgotPassword(seller.email,newOTP);
        
        return res.status(200).send({_id: seller._id, message: "OTP has been sent to your email"});
    }
    else
    {
        return res.status(400).send("Email not Registered");
    }
};

//check OTP for Resetting Password(User not logged in)
module.exports.resetPassword = async (req,res) => {

    let seller = await Seller.findById(req.params.id);
    
    if(seller)
    {
        if (req.body.password.length<5)
        {
            return res.status(400).send("Password must at least be 5 Characters");
        }
        else if (req.body.password.length>15)
        {
            return res.status(400).send("Password cannot be more than 15 Characters");
        }

        let nowTime = new Date();
        if(seller.otpExpiry > nowTime)
        {
            if(req.body.otp === seller.otp)
            {
                let salt = await bcrypt.genSalt(5);
                let newPassword = await bcrypt.hash(req.body.password, salt);
                
                //saving new Password and setting otpExpiry to now
                await Seller.findByIdAndUpdate(seller._id,{password: newPassword, otpExpiry: nowTime});
                return res.status(202).send("Password Reset Successfuly");
            }
            else
            {
                return res.status(400).send("Invalid OTP");
            }
        }
        else
        {
            return res.status(401).send("OTP has expired");
        }
    }
    else
    {
        return res.status(400).send("User not found");
    }
};




//_________________________________________________________________________
//                              Logged-In Seller
//_________________________________________________________________________

//Request Code to Verify Seller Email
module.exports.getVerificationCode = async (req,res) => {

    try
    {
        let newOTP = Math.floor((Math.random()*10000)+1).toString();
        let newOTPExpiry = new Date();
        let nowMinutes = newOTPExpiry.getMinutes();
        newOTPExpiry.setMinutes(nowMinutes+5);
        await Seller.findByIdAndUpdate(req.seller._id, {otp: newOTP, otpExpiry: newOTPExpiry});
        await Mailer.verify(req.seller.email,newOTP);

        return res.send("Verification Code has been sent to your Registered Email Address");
        //return res.status(500).send("Could not complete Request");
    }
    catch(err)
    {
        return res.status(500).send(err.message);
    }
};

//Check Code to verify Email
module.exports.verify = async (req,res) => {
    
    try
    {
        let nowTime = new Date();
        if(req.seller.otpExpiry > nowTime)
        {
            if(req.body.otp === req.seller.otp)
            {
                await Seller.findByIdAndUpdate(req.seller._id, {emailVerified: true});
                return res.send("Account Verified Successfully");
            }
            else
            {
                return res.status(400).send("Invalid Code");
            }
        }
        else
        {
            return res.status(400).send("Code Expired");
        }
    }
    catch(err)
    {
        return res.status(500).send(err.message);
    }
};

//Send Account Verification Details
module.exports.getStatus = async (req,res) => {

    try
    {
        return res.status(200).send(_.pick(req.seller, ['emailVerified', 'status', 'blocked']));
    }
    catch(err)
    {
        return res.status(500).send(err.message);
    }
};

//Get Seller Profile Details
module.exports.getDetails = async (req,res) => {

    try{
        let seller = await Seller.findById(req.seller._id).populate('city');
        return await res.send(_.omit(JSON.parse(JSON.stringify(seller)),['password','otp','otpExpiry','__v','emailVerified','status','blocked','avatar.cloudinaryID','cnicImages', 'accountStatement', 'billImages', 'ntn', 'balance', 'events', 'adminName', 'adminComment']));
    }
    catch(err){
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Add Seller Details
module.exports.addDetails = async (req,res) => {

    try
    {
        console.log(req.body);

        //Verifying Seller Block Email status
        if(req.seller.blocked)
        {
            return res.status(401).send("Account Blocked");
        }
        if(!req.seller.emailVerified)
        {
            return res.status(401).send("Verify Your Email");
        }
        if(req.seller.status==='APPROVED')
        {
            return res.status(401).send("Details Completed Already");
        }

        //Checking Image Files Array
        if(!req.files || req.files.length===0)
        {
            return res.status(400).send("No Images Selected");
        }
        if(req.files.length != 6)
        {
            console.log(req.files);
            return res.status(400).send("Upload All Required Images");
        }

        //Joi Validation for all Properties
        const { accountNumber, accountTitle, bankTitle, advancePaymentAmount, advancePaymentCriteria, ...reqBody } = req.body;
        let { error } = validateSellerAddDetails(reqBody);
        if(error)
        {
            console.log(error);
            return res.status(400).send(error.details[0].message);
        }

        //Name should contain only letters
        if (!/^[a-zA-Z]+$/.test(req.body.fName))
        {
            return res.status(400).send("First Name must include only Letters");
        }
        if (!/^[a-zA-Z]+$/.test(req.body.lName))
        {
            return res.status(400).send("First Name must include only Letters");
        }

        let seller = {
            fName: req.body.fName,
            lName:  req.body.lName,
            cnicNumber: req.body.cnic,
            storeName: req.body.storeName,
            address: req.body.address,
            city: req.body.city,
            phone: req.body.phone,
            onlinePaymentOption: req.body.onlinePaymentOption,
            sameCityDeliveryCharge: Math.floor(req.body.sameCityDeliveryCharge),
            diffCityDeliveryCharge: Math.floor(req.body.diffCityDeliveryCharge),
            status: 'PENDING',
            $push: { events: {name: 'Requested Approval', date: new Date()} },
            ntn: req.body.ntn,
            advancePayment: req.body.advancePayment
        };

        //Joi Validation if Online Payment Enabled
        if ( req.body.onlinePaymentOption === true || req.body.onlinePaymentOption === 'true' )
        {
            let { error } = validateAccountDetails({ accountNumber, accountTitle, bankTitle });
            if(error)
            {
                return res.status(400).send(error.details[0].message);
            }
            seller.accountDetails = {
                accountNumber: req.body.accountNumber,
                accountTitle: req.body.accountTitle,
                bankTitle: req.body.bankTitle
            }
        }

        //Validation for Advance Payment
        if (req.body.advancePayment === true || req.body.advancePayment == 'true')
        {
            if (req.body.onlinePaymentOption === 'false' || req.body.onlinePaymentOption === false)
            {
                return res.status(400).send("Enable Online Payments to recieve Advance Payment");
            }
            else if ( req.body.onlinePaymentOption === 'true' || req.body.onlinePaymentOption === true )
            {
                let { error } = validateAdvancePayment({advancePaymentAmount, advancePaymentCriteria});
                if(error)
                {
                    return res.status(400).send(error.details[0].message);
                }
                seller.advancePaymentAmount = Math.floor(req.body.advancePaymentAmount);
                seller.advancePaymentCriteria = Math.floor(req.body.advancePaymentCriteria);
            }
        }

        //Uploading Files
        const urls = [];
        const files = req.files;

        for(const file of files) 
        {
            const { path } = file;
            var newPath;
            
            try
            {
                newPath = await cloudinary.uploader.upload(path);
            }
            catch
            {
                return res.status(400).send("Please Select a Valid Image");
            }
  
            urls.push({link: newPath.secure_url, cloudinaryID: newPath.public_id});
  
            fs.unlinkSync(path);
        }

        seller.avatar= urls[0];
        seller.cnicImages= [
            urls[1],
            urls[2]
        ];
        seller.billImages= [
            urls[3],
            urls[4]
        ];
        seller.accountStatement= urls[5];

        await Seller.findByIdAndUpdate(req.seller._id, seller);

        return res.send("Seller Details Updated Successfully");
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Edit Seller Details
module.exports.editDetails = async (req,res) => {

    try
    {
        const { accountNumber, accountTitle, bankTitle, advancePaymentAmount, advancePaymentCriteria, ...reqBody } = req.body;
        let { error } = validateSellerEditDetails(reqBody);
        if(error)
        {
            return res.status(400).send(error.details[0].message);
        }

        let isValid = await bcrypt.compare( req.body.password, req.seller.password);
        
        if ( isValid )
        {

            let seller = {
                storeName: req.body.storeName,
                phone: req.body.phone,
                onlinePaymentOption: req.body.onlinePaymentOption,
                sameCityDeliveryCharge: Math.floor(req.body.sameCityDeliveryCharge),
                diffCityDeliveryCharge: Math.floor(req.body.diffCityDeliveryCharge),
                advancePayment: req.body.advancePayment
            };

            //Joi Validation if Online Payment Enabled
            if ( req.body.onlinePaymentOption === true || req.body.onlinePaymentOption === 'true' )
            {
                let { error } = validateAccountDetails({ accountNumber, accountTitle, bankTitle });
                if(error)
                {
                    return res.status(400).send(error.details[0].message);
                }
                seller.accountDetails= {
                    accountNumber: req.body.accountNumber,
                    accountTitle: req.body.accountTitle,
                    bankTitle: req.body.bankTitle
                }
            }

            //Validation for Advance Payment
            if (req.body.advancePayment === true || req.body.advancePayment == 'true')
            {
                if (req.body.onlinePaymentOption === 'false' || req.body.onlinePaymentOption === false)
                {
                    return res.status(400).send("Enable Online Payments to recieve Advance Payment");
                }
                else if ( req.body.onlinePaymentOption === 'true' || req.body.onlinePaymentOption === true )
                {
                    let { error } = validateAdvancePayment({advancePaymentAmount, advancePaymentCriteria});
                    if(error)
                    {
                        return res.status(400).send(error.details[0].message);
                    }
                    seller.advancePaymentAmount = Math.floor(req.body.advancePaymentAmount);
                    seller.advancePaymentCriteria = Math.floor(req.body.advancePaymentCriteria);
                }
            }

            await Seller.findByIdAndUpdate(req.seller._id, seller);

            return res.send("Seller Details Updated Successfully");
        }
        else
        {
            return res.status(400).send("Incorrect Password");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Edit Avatar for Seller Profile
module.exports.editAvatar = async (req,res) => {

    try{
        var result;
        console.log(req.file);
        try{
            result = await cloudinary.uploader.upload(req.file.path);
        }
        catch(err){
            console.log(err);
            return res.status(400).send("Please Select a Valid Image");
        }

        try{
            await cloudinary.uploader.destroy(req.seller.cloudinaryID);
        }
        catch{}

        await Seller.findByIdAndUpdate(req.seller._id, { avatar: {link: result.secure_url, cloudinaryID: result.public_id } });
        return res.send("Image Updated");
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Get Seller Current Balance
module.exports.fetchBalance = async (req,res) => {

    try
    {
        return res.send({balance: req.seller.balance});
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//_________________________________________________________________________
//                                 Admin APIs
//_________________________________________________________________________

//Get Seller List
module.exports.fetchList = async (req,res) => {

    try
    {
        let sellers = [];
        if ( req.params.status === 'ALL')
        {
            sellers = await Seller.find({}, 'fName lName email storeName status blocked');
        }
        else if ( req.params.status === 'ACTIVE' )
        {
            sellers = await Seller.find({blocked: false}, 'fName lName email storeName status blocked');
        }
        else if ( req.params.status === 'BLOCKED' )
        {
            sellers = await Seller.find({blocked: true}, 'fName lName email storeName status blocked');
        }
        else if ( req.params.status === 'NEW' )
        {
            sellers = await Seller.find({status: 'NEW'}, 'fName lName email storeName status blocked');
        }
        else if ( req.params.status === 'PENDING' )
        {
            sellers = await Seller.find({status: 'PENDING'}, 'fName lName email storeName status blocked');
        }
        else if ( req.params.status === 'APPROVED' )
        {
            sellers = await Seller.find({status: 'APPROVED'}, 'fName lName email storeName status blocked');
        }
        else if ( req.params.status === 'REJECTED' )
        {
            sellers = await Seller.find({status: 'REJECTED'}, 'fName lName email storeName status blocked');
        }

        if ( sellers.length > 0 )
        {
            return res.send(sellers);
        }
        else
        {
            return res.status(400).send("No Sellers Found");
        }
        
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send(err.message);
    }
};

//Get Seller Account Details
module.exports.fetchFullDetails = async (req,res) => {

    try
    {
        let seller = await Seller.findById(req.params.id).populate('city');
        return await res.send(_.omit(JSON.parse(JSON.stringify(seller)),['password','otp','otpExpiry','__v']));
    }
    catch(err){
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Approve/Dissaprove New Seller
module.exports.approveSeller = async (req,res) => {

    try
    {
        console.log("Mailer Needed");

        let seller = await Seller.findById(req.params.id);

        if (seller)
        {
            if (req.body.status === 'APPROVE')
            {
                if ( seller.status!='PENDING' )
                {
                    return res.status(400).send("Unauthorized");
                }
                else
                {
                    await Seller.findByIdAndUpdate(seller._id, { status: 'APPROVED', adminName: req.admin.name, adminComment: req.body.reason,  $push: { events: {name: 'APPROVED', date: new Date(), adminName: req.admin.name, adminComment: req.body.reason} }});
                    return res.send("Seller Approved");
                }
            }
            else if (req.body.status === 'REJECT')
            {
                if ( seller.status!='PENDING' )
                {
                    return res.status(400).send("Unauthorized");
                }
                else
                {
                    let { error } = validateSellerChangeStatus(req.body);
                    if(error)
                    {
                        return res.status(400).send(error.details[0].message);
                    }
                    await Seller.findByIdAndUpdate(seller._id, { status: 'REJECTED', adminName: req.admin.name, adminComment: req.body.reason,  $push: { events: {name: 'REJECTED', date: new Date(), adminName: req.admin.name, adminComment: req.body.reason} }});
                    return res.send("Seller Rejected");
                }
            }
            else
            {
                return res.status(400).send("Invalid Status");
            }
        }
        else
        {
            return res.status(400).send("Seller Not Found");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Block/Unblock Seller
module.exports.changeStatus = async (req,res) => {

    try
    {
        let seller = await Seller.findById(req.params.id);

        if (seller)
        {
            if (req.body.status === 'BLOCK')
            {
                if ( seller.blocked === true )
                {
                    return res.status(400).send("Seller already Blocked");
                }
                else
                {
                    let { error } = validateSellerChangeStatus(req.body);
                    if(error)
                    {
                        return res.status(400).send(error.details[0].message);
                    }
                    await Seller.findByIdAndUpdate(seller._id, { blocked: true, adminName: req.admin.name, adminComment: req.body.reason,  $push: { events: {name: 'BLOCKED', date: new Date(), adminName: req.admin.name, adminComment: req.body.reason} }});
                    productController.updateBlocked(seller._id, 'BLOCKED');
                    orderController.updateBlocked(seller._id);
                    return res.send("Seller Blocked");
                }
            }
            else if (req.body.status === 'UNBLOCK')
            {
                if ( seller.blocked === true )
                {
                    await Seller.findByIdAndUpdate(seller._id, { blocked: false, adminName: req.admin.name, adminComment: req.body.reason,  $push: { events: {name: 'UN-BLOCKED', date: new Date(), adminName: req.admin.name, adminComment: req.body.reason} }});
                    productController.updateBlocked(seller._id, 'UNBLOCKED');
                    return res.send("Seller Un-blocked");
                }
                else
                {
                    return res.status(400).send("Seller already Active");
                }
            }
            else
            {
                return res.status(400).send("Invalid Status");
            }
        }
        else
        {
            return res.status(400).send("Seller Not Found");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Get Sellers for Dashboard
module.exports.getActiveSellers = async (req,res) => {

    try
    {
        let values = [];
        let nowDate = new Date();

        for (let i=0;i<6;i++)
        {
            let newDate = new Date();
            newDate.setMonth(nowDate.getMonth()-i);

            //console.log("NewDate: ", newDate);

            //Getting Month Names
            let name = newDate.toLocaleString('default', { month: 'short' }) + " " + newDate.getFullYear();
            //console.log("Name: ", name);

            //Getting New Sellers in the month
            let activeSellers = await Seller.countDocuments({createdAt: { $lt: newDate }, status: 'APPROVED'}); 
            //console.log("activesellers: ", activeSellers);

            values.push({
                name: name,
                "Active Sellers": activeSellers
            });
        }

        // let newArray = [11];
        // for (i=11;i>=0;i--)
        // {
        //     newArray[i]=values[11-i];
        // }

        return res.send(values.reverse());
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Hold or Lift Hold
module.exports.hold = async (req,res) => {

    try
    {
        let seller = await Seller.findById(req.params.id);

        if (seller)
        {
            if (req.body.status === 'HOLD')
            {
                if ( seller.hold === true )
                {
                    return res.status(400).send("Seller already on Hold");
                }
                else
                {
                    let { error } = validateSellerHold({reason: req.body.reason});
                    if(error)
                    {
                        return res.status(400).send(error.details[0].message);
                    }
                    await Seller.findByIdAndUpdate(seller._id, { hold: true, adminName: req.admin.name, adminComment: req.body.reason,  $push: { events: {name: 'HOLD', date: new Date(), adminName: req.admin.name, adminComment: req.body.reason} }});
                    return res.send("Seller put on hold");
                }
            }
            else if (req.body.status === 'UNHOLD')
            {
                if ( seller.hold === true )
                {
                    await Seller.findByIdAndUpdate(seller._id, { hold: false, adminName: req.admin.name, adminComment: req.body.reason,  $push: { events: {name: 'UNHOLD', date: new Date(), adminName: req.admin.name, adminComment: req.body.reason} }});
                    return res.send("Seller Un-blocked");
                }
                else
                {
                    return res.status(400).send("Seller already not on Hold");
                }
            }
            else
            {
                return res.status(400).send("Invalid Status");
            }
        }
        else
        {
            return res.status(400).send("Seller Not Found");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//_________________________________________________________________________
//                              Buyer APIs
//_________________________________________________________________________

module.exports.getStoreDetails = async (req,res) => {

    try
    {
        let seller = await Seller.findOne({_id: req.params.id, status: 'APPROVED'}, 'storeName city onlinePaymentOption sameCityDeliveryCharge diffCityDeliveryCharge avatar advancePayment advancePaymentAmount advancePaymentCriteria').populate('city');

        if (seller)
        {
            return res.send(seller);
        }
        else
        {
            return res.status(400).send("Seller not found");
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

//Get Seller ID from Name for Search
module.exports.getSellerID = async(key) => {

    try
    {
        let seller = await Seller.findOne({storeName: {$regex: key,$options:'i'}});

        if(seller)
        {
            return seller._id;
        }
        else
        {
            return;
        }
    }
    catch(err)
    {
        console.log(err);
        return;
    }
};

//Update Seller Current Balance
module.exports.updateBalance = async(sellerID, amount) => {

    try
    {
        await Seller.findByIdAndUpdate(sellerID, { $inc: {balance: amount} });
        console.log("Seller Balance Updated");
        return;
    }
    catch(err)
    {
        console.log("Error Updating Seller Balance (Internal Func)");
        console.log(err);
        return;
    }
}


module.exports.getSellerForWithdrawal = async(sellerID) => {

    try
    {
        let seller = await Seller.findById(sellerID);

        if(seller)
        {
            return seller;
        }
        else
        {
            console.log("Seller not found for Withdrawal (Internal Func)");
            return;
        }
    }
    catch(err)
    {
        console.log("Error Getting Seller for Withdrawal (Internal Func)");
        console.log(err);
        return;
    }
};

//New Order Email
module.exports.newOrderEmail = async(sellerID) => {

    try
    {
        let seller = await Seller.findById(sellerID);

        if(seller)
        {
            Mailer.newOrderEmail(seller.email);
            return;
        }
        else
        {
            console.log("Seller not found for Email (Internal Func)");
            return;
        }
    }
    catch(err)
    {
        console.log("Error Getting Seller for Email (Internal Func)");
        console.log(err);
        return;
    }
}