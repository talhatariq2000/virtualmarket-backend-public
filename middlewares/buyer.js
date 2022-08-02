const jwt = require("jsonwebtoken");
const config = require("config");
var requestIp = require('request-ip');
const dotenv = require("dotenv").config();

const {Buyer} = require("../models/buyer");

//checking for jwt token
module.exports.authenticator = async (req,res,next) => {

    var clientIp = requestIp.getClientIp(req);
    console.log("Client IP: " + clientIp);

    let token = req.header("x-auth-token");

    if(!token)
    {
        return res.status(401).send("Please Login");
    }

    try{
        //let buyer = jwt.verify(token, config.get("jwtSecretKey"));
        let buyer = jwt.verify(token, process.env.JWT_SECRET_KEY);
        console.log(buyer);
        buyer = await Buyer.findById(buyer._id)
        if(buyer)
        {
            req.buyer = buyer;
            next();
        }
        else
        {
            return res.status(400).send("Please Login")
        }
    }
    catch(err){
        console.log(err.message);
        return res.status(401).send("Please Login");
    }
    
};

//Check for Blocked, Incomplete Info or Unverified Buyer
module.exports.verifier = async (req,res,next) => {


    try
    {
        console.log(req.body);
        if(!req.buyer.emailVerified)
        {
            return res.status(401).send("Please verify your email");
        }
        else if(!req.buyer.infoCompleted)
        {
            return res.status(401).send("Please complete your Buyer Profile");
        }
        else if(req.buyer.blocked)
        {
            return res.status(401).send("ACCOUNT BLOCKED");
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
}

//Optionally check for jwt token
module.exports.checker = async (req,res,next) => {

    try
    {
        let token = req.header("x-auth-token");

        if(token)
        {
            let buyer = jwt.verify(token, process.env.JWT_SECRET_KEY);
            console.log(buyer);
            buyer = await Buyer.findById(buyer._id)
                
            if(buyer)
            {
                req.buyer = buyer;
            }
        }
        next();
    }
    catch(err)
    {
        console.log(err.message);
        next();
    }
};