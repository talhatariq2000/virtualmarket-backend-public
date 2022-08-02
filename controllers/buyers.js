const express = require('express');
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const config = require("config");
const fs = require('fs');
const dotenv = require("dotenv").config();

var { Buyer, validateBuyerLogin, validateBuyerSignup, validateBuyerDetails, validateBuyerChangeStatus } = require("../models/buyer");

var Mailer = require("../utils/mailer");
const Mail = require('nodemailer/lib/mailer');
const { now } = require('lodash');
const { UploadStream } = require('cloudinary');
const cloudinary = require("../utils/cloudinary");




//_________________________________________________________________________
//                              Logged-Out Buyer
//_________________________________________________________________________

//Create New Buyer Account
module.exports.createBuyer = async (req,res) => {
    
    let { error } = validateBuyerSignup(req.body);
    if(error)
    {
        return res.status(400).send(error.details[0].message);
    }

    //Checking Fname Lname for numbers or characters
    if (!/^[a-zA-Z]+$/.test(req.body.fName))
    {
        return res.status(400).send("First Name must include only Letters");
    }
    if (!/^[a-zA-Z]+$/.test(req.body.lName))
    {
        return res.status(400).send("First Name must include only Letters");
    }

    let buyer = await Buyer.findOne({email:req.body.email.toLowerCase()});
    if (buyer)
    {
        return res.status(400).send("Email already in use");
    }
    else
    {
        if(req.body.password === req.body.confirmPassword)
        {
            buyer = new Buyer();

            buyer.createdAt = new Date();
            buyer._id = new mongoose.Types.ObjectId();
            buyer.email = req.body.email.toLowerCase();
            buyer.events.push({date: buyer.createdAt, name: 'Account Created'});

            let salt = await bcrypt.genSalt(5);
            buyer.password = await bcrypt.hash(req.body.password, salt);

            buyer.verificationToken = jwt.sign( {email: buyer.email}, process.env.JWT_SECRET_KEY);
        }
        else
        {
            return res.status(400).send("Password and Confirm Password Mismatch")
        }

        try
        {
            await buyer.save();
            Mailer.newAccount(buyer.email);
            Mailer.verifyEmail(buyer.email, buyer.verificationToken);
            return res.status(201).send("Account Created");
        }
        catch(err)
        {
            return res.status(400).send(err.message);
        }
    }
};

//Login Buyer
module.exports.loginBuyer = async (req,res) => {

    let { error } = validateBuyerLogin(req.body);
    if(error)
    {
        return res.status(400).send(error.details[0].message);
    }

    let buyer = await Buyer.findOne({email:req.body.email.toLowerCase()});
    if (!buyer)
    {
        return res.status(400).send("Email not registered");
    }
    else
    {
        let isValid = await bcrypt.compare( req.body.password, buyer.password);
        if(!isValid)
        {
            return res.status(401).send("Invalid Password");
        }
        else
        {
            try{
                let token = jwt.sign( {_id: buyer._id, email: buyer.email}, process.env.JWT_SECRET_KEY);
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

    let buyer = await Buyer.findOne({email:req.body.email.toLowerCase()});

    if(buyer)
    {
        let newOTP = Math.floor((Math.random()*10000)+1).toString();
        let newOTPExpiry = new Date();
        let nowMinutes = newOTPExpiry.getMinutes();
        newOTPExpiry.setMinutes(nowMinutes+5);
        await Buyer.findByIdAndUpdate(buyer._id, {otp: newOTP, otpExpiry: newOTPExpiry});
        Mailer.forgotPassword(buyer.email,newOTP);

        return res.status(200).send({_id: buyer._id, message: "OTP has been sent to your email"});
    }
    else
    {
        return res.status(400).send("Email not Registered");
    }
};

//check OTP for Resetting Password(User not logged in)
module.exports.resetPassword = async (req,res) => {

    let buyer = await Buyer.findById(req.params.id);
    
    if(buyer)
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
        if(buyer.otpExpiry > nowTime)
        {
            if(req.body.otp === buyer.otp)
            {
                let salt = await bcrypt.genSalt(5);
                let newPassword = await bcrypt.hash(req.body.password, salt);
                
                //saving new Password and setting otpExpiry to now
                await Buyer.findByIdAndUpdate(buyer._id,{password: newPassword, otpExpiry: nowTime});
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

//Check OTP to verify Email OLD
module.exports.verifyEmail = async (req,res) => {
    
    try
    {
        console.log(req.body.token)
        let buyer = jwt.verify(req.body.token, process.env.JWT_SECRET_KEY);

        buyer = await Buyer.findOne({email: buyer.email});

        if(buyer)
        {
            if ( buyer.verificationToken === req.body.token )
            {
                await Buyer.findByIdAndUpdate(buyer._id, {emailVerified: true});
                return res.send("Account Verified Successfully");
            }
            else
            {
                return res.status(400).send("Link Expired");
            }
        }
        else
        {
            return res.status(400).send("Invalid Link");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(400).send("Invalid Link");
    }
};


//_________________________________________________________________________
//                              Logged-In Buyer
//_________________________________________________________________________

//get Buyer name
module.exports.getAvatar = async (req,res) => {

    try
    {
        return res.send({avatar: req.buyer.avatar});
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//get single Buyer Details
module.exports.getDetails = async (req,res) => {

    try
    {
        let buyer = await Buyer.findById(req.buyer._id).populate('city');
        return await res.send(_.omit(JSON.parse(JSON.stringify(buyer)),['password','otp','otpExpiry','__v']));
    }
    catch(err){
        return res.status(500).send(err.message);
    }
};

//Edit Buyer Details
module.exports.editDetails = async (req,res) => {

    try
    {
        let { error } = validateBuyerDetails(req.body);
        if(error)
        {
            return res.status(400).send(error.details[0].message);
        }

        if (!/^[a-zA-Z]+$/.test(req.body.fName))
        {
            return res.status(400).send("First Name must include only Letters");
        }
        if (!/^[a-zA-Z]+$/.test(req.body.lName))
        {
            return res.status(400).send("First Name must include only Letters");
        }

        await Buyer.findByIdAndUpdate(req.buyer._id, 
        {
            fName: req.body.fName,
            lName:  req.body.lName,
            phone: req.body.phone,
            address: req.body.address,
            city: req.body.city,
            infoCompleted: true
        });
        return res.send("Buyer Details Updated Successfully");
    }
    catch(err)
    {
        return res.status(500).send(err.message);
    }
};

//Edit Avatar for Buyer Profile
module.exports.editAvatar = async (req,res) => {

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

        try
        {
            await cloudinary.uploader.destroy(req.buyer.cloudinaryID);
        }
        catch{}

        await Buyer.findByIdAndUpdate(req.buyer._id, { avatar: result.secure_url, cloudinaryID: result.public_id });
        return res.send("Image Updated");
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Change Buyer Password
module.exports.changePassword = async (req,res) => {

    try
    {
        if ( !req.body.oldPassword)
        {
            return res.status(400).send("Enter Old Password");
        }
        if ( !req.body.newPassword)
        {
            return res.status(400).send("Enter New Password");
        }
        let isValid = await bcrypt.compare( req.body.oldPassword, req.buyer.password);
        if(isValid)
        {
            let salt = await bcrypt.genSalt(5);
            let newPassword = await bcrypt.hash(req.body.newPassword, salt);

            await Buyer.findByIdAndUpdate(req.buyer._id, {password: newPassword});
            return res.send("Password Changed Successfully");
        }
        else
        {
            return res.status(400).send("Incorrect Old Password Entered");
        }
    }
    catch(err)
    {
        return res.status(500).send(err.message)
    }
};

//Send email to Verify Email
module.exports.verificationOTP = async (req,res) => {

    try
    {
        // let newOTP = Math.floor((Math.random()*10000)+1).toString();
        // let newOTPExpiry = new Date();
        // let nowMinutes = newOTPExpiry.getMinutes();
        // newOTPExpiry.setMinutes(nowMinutes+5);
        // await Buyer.findByIdAndUpdate(req.buyer._id, {otp: newOTP, otpExpiry: newOTPExpiry});
        // Mailer.verify(req.buyer.email,newOTP);
        // return res.send("Verification Code has been sent to your Registered Email Address");

        let verificationToken = jwt.sign( {email: req.buyer.email}, process.env.JWT_SECRET_KEY);
        await Buyer.findByIdAndUpdate(req.buyer._id, { verificationToken: verificationToken });
        Mailer.verifyEmail(req.buyer.email, verificationToken);
        return res.send("Verification Link has been sent to your Registered Email Address");
    }
    catch(err)
    {
        return res.status(500).send(err.message);
    }
    
};



//Check OTP to verify Email OLD
module.exports.verify = async (req,res) => {
    
    try
    {
        let nowTime = new Date();
        if(req.buyer.otpExpiry > nowTime)
        {
            if(req.body.otp === req.buyer.otp)
            {
                await Buyer.findByIdAndUpdate(req.buyer._id, {emailVerified: true});
                return res.send("Account Verified Successfully");
            }
            else
            {
                return res.status(400).send("Invalid OTP");
            }
        }
        else
        {
            return res.status(400).send("OTP Expired");
        }
    }
    catch(err)
    {
        return res.status(500).send(err.message);
    }
};

//Get Buyer Status to proceed to Checkout
module.exports.getStatus = async (req,res) => {
    
    try
    {
        return res.status(200).send(_.pick(req.buyer, ['emailVerified', 'infoCompleted']));
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send(err.message);
    }
};

//Get Buyer Contact & Address for Order
module.exports.fetchDeliveryDetails = async (req,res) => {

    try
    {
        await req.buyer.populate('city');
        return res.status(200).json({
            name: req.buyer.fName+" "+req.buyer.lName,
            address: req.buyer.address,
            city: req.buyer.city,
            phone: req.buyer.phone
        });
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};


//_________________________________________________________________________
//                              APIs for Admin
//_________________________________________________________________________

//Get Buyer List
module.exports.fetchList = async (req,res) => {

    try
    {
        let buyers = [];
        if ( req.params.status === 'ALL')
        {
            buyers = await Buyer.find({}, 'fName lName email blocked infoCompleted');
        }
        else if ( req.params.status === 'ACTIVE' )
        {
            buyers = await Buyer.find({blocked: false}, 'fName lName email blocked infoCompleted');
        }
        else if ( req.params.status === 'BLOCKED' )
        {
            buyers = await Buyer.find({blocked: true}, 'fName lName email blocked infoCompleted');
        }

        if ( buyers.length > 0 )
        {
            return res.send(buyers);
        }
        else
        {
            return res.status(400).send("No Buyers Found");
        }
        
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send(err.message);
    }
};

//Get Buyer Account Details
module.exports.fetchFullDetails = async (req,res) => {

    try
    {
        let buyer = await Buyer.findById(req.params.id).populate('city');
        return await res.send(_.omit(JSON.parse(JSON.stringify(buyer)),['password','otp','otpExpiry','__v']));
    }
    catch(err){
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Block/Unblock Buyer
module.exports.changeStatus = async (req,res) => {

    try
    {
        let buyer = await Buyer.findById(req.params.id);

        if (buyer)
        {
            if (req.body.status === 'BLOCK')
            {
                if ( buyer.blocked )
                {
                    return res.status(400).send("Buyer already Blocked");
                }
                else
                {
                    let { error } = validateBuyerChangeStatus(req.body);
                    if(error)
                    {
                        return res.status(400).send(error.details[0].message);
                    }
                    await Buyer.findByIdAndUpdate(buyer._id, { blocked: true, adminName: req.admin.name, adminComment: req.body.reason,  $push: { events: {name: 'BLOCKED', date: new Date(), adminName: req.admin.name, adminComment: req.body.reason}}});
                    return res.send("Buyer Blocked");
                }
            }
            else if (req.body.status === 'UNBLOCK')
            {
                if ( buyer.blocked )
                {
                    await Buyer.findByIdAndUpdate(buyer._id, { blocked: false, adminName: req.admin.name, adminComment: req.body.reason,  $push: { events: {name: 'UN-BLOCKED', date: new Date(), adminName: req.admin.name, adminComment: req.body.reason}}});
                    return res.send("Buyer Un-blocked");
                }
                else
                {
                    return res.status(400).send("Buyer already Active");
                }
            }
            else
            {
                return res.status(400).send("Invalid Status");
            }
        }
        else
        {
            return res.status(400).send("Buyer Not Found");
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

module.exports.getBuyerDetails = async (buyerID) => {

    try
    {
        let buyer = await Buyer.findById(buyerID);
        return buyer;
    }
    catch(err)
    {
        console.log("Error Fetching Buyer Details (Internal Func)");
        console.log(err);
        return;
    }
};





//Reference Function for Single uploads
module.exports.upload = async (req,res) => {
    console.log(req);
    
    try{
        const urls = [];
  
        const files = req.files;
        console.log(req.files);
        for(const file of files) {
  
            const { path } = file;
            //const newPath = await cloudinary.uploader.upload(path);
  
            //urls.push({avatar: newPath.secure_url, cloudinaryID: newPath.public_id});
  
            fs.unlinkSync(path);
        }
        return res.send(urls);
    }
    catch(err)
    {
        console.log(err);
        return res.status(401).send(err.message);
    }
};