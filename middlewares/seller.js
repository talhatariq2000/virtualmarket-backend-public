const jwt = require("jsonwebtoken");
const config = require("config");
const dotenv = require("dotenv").config();

const {Seller} = require("../models/seller");

//checking for jwt token
module.exports.authenticator = async (req,res,next) => {

    let token = req.header("x-auth-token");

    if(!token)
    {
        return res.status(401).send("Seller not Logged In");
    }

    try{
        let seller = jwt.verify(token, process.env.JWT_SECRET_KEY);
        console.log(seller);
        seller = await Seller.findById(seller._id);
        if(seller)
        {
            req.seller = seller;
            next();
        }
        else
        {
            return res.status(400).send("Seller does not Exist")
        }
    }
    catch(err){
        return res.status(401).send(err.message);
    }
    
};

//check for Email-Verification, Complete Details and Blocked Acc
module.exports.verifier = async (req,res,next) => {

    if(!req.seller.emailVerified)
    {
        return res.status(401).send("Email not Verified");
    }
    else if(req.seller.status!='APPROVED')
    {
        return res.status(401).send("Seller Details not Completed");
    }
    else if(req.seller.blocked)
    {
        return res.status(401).send("ACCOUNT BLOCKED");
    }
    else
    {
        next();
    }
};

//Check Valid Seller ID for Chat
module.exports.checkSeller = async (req,res,next) => {

    try
    {
        let seller = await Seller.findById(req.body.seller);

        if (!seller)
        {
            return res.status(400).send("Seller does not Exist");
        }
        else
        {
            next();
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//check seller for withdrawal
module.exports.checkSellerForWithdrawal = async (req,res,next) => {

    try
    {
        let seller = await Seller.findById(req.params.id);

        if (!seller)
        {
            return res.status(400).send("Seller does not Exist");
        }
        else
        {
            req.seller = seller;
            next();
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};