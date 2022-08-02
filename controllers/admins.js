const express = require('express');
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const _ = require("lodash");
const jwt = require("jsonwebtoken");
const config = require("config");
const fs = require('fs');
const dotenv = require("dotenv").config();

var { Admin, validateAdminSignup } = require("../models/admin");

var Mailer = require("../utils/mailer");
const { now } = require('lodash');




//_________________________________________________________________________
//                              Logged-Out Buyer
//_________________________________________________________________________

//Create New Admin Account
module.exports.createAdmin = async (req,res) => {
    
    let { error } = validateAdminSignup(req.body);
    if(error)
    {
        return res.status(400).send(error.details[0].message);
    }

    let admin = await Admin.findOne( { $or: [ {email:req.body.email}, {username: req.body.username} ] } );

    if (admin)
    {
        return res.status(400).send("Email/Username already in use");
    }
    else
    {
        admin = new Admin();

        admin._id = new mongoose.Types.ObjectId();
        admin.name = req.body.name;
        admin.username = req.body.username;
        admin.email = req.body.email;

        try
        {
            await admin.save();
            return res.status(201).send("New Admin Created");
        }
        catch(err)
        {
            console.log(err);
            return res.status(400).send(err.message);
        }
    }
};

//generate OTP for forgot password(User not logged in)
module.exports.sendOTP = async (req,res) => {

    try
    {
        let admin = await Admin.findOne({username:req.body.username});

        if(admin)
        {
            //Creating OTP
            let OTP = Math.floor((Math.random()*10000)+1).toString();
            //Creating OTP Expiry
            let OTPExpiry = new Date();
            OTPExpiry.setMinutes(OTPExpiry.getMinutes()+5);
            //Encrypting OTP
            let salt = await bcrypt.genSalt(5);
            admin.otp = await bcrypt.hash(OTP, salt);
            
            await Admin.findByIdAndUpdate(admin._id, {otp: admin.otp, otpExpiry: OTPExpiry});
            Mailer.sendAdminOTP(admin.email,OTP);
            return res.status(200).send("OTP Sent to registered email");
        }
        else
        {
            return res.status(400).send("Invalid Username");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(400).send(err.message);
    }
};

//Login Buyer
module.exports.loginAdmin = async (req,res) => {

    try
    {
        let admin = await Admin.findOne({username:req.body.username});

        if (!admin)
        {
            return res.status(400).send("Invalid Username");
        }
        else
        {
            let nowTime = new Date();
            if(admin.otpExpiry > nowTime)
            {
                let isValid = await bcrypt.compare( req.body.otp, admin.otp);
                if(!isValid)
                {
                    return res.status(401).send("Invalid OTP");
                }
                else
                {
                    let token = jwt.sign( {_id: admin._id, name: admin.name}, process.env.JWT_SECRET_KEY);
                    res.status(202).send(token);
        
                    token1 = jwt.verify(token, process.env.JWT_SECRET_KEY);
                    let jwtTime = new Date(token1.iat*1000);
                    await Admin.findByIdAndUpdate(admin._id, {tokenGeneratedAt:jwtTime, otpExpiry: nowTime});
                    return;
                }
            }
            else
            {
                return res.status(401).send("OTP Expired");   
            }
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(400).send(err.message);
    }

};
