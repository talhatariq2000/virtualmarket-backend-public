const jwt = require("jsonwebtoken");
const config = require("config");
const dotenv = require("dotenv").config();

const {Admin} = require("../models/admin");

//checking for jwt token
module.exports.authenticator = async (req,res,next) => {

    let token = req.header("x-auth-token");
    
    if(!token)
    {
        return res.status(401).send("Please Login");
    }

    try
    {
        let sign = jwt.verify(token, process.env.JWT_SECRET_KEY);
        console.log(sign);
        let jwtDate = new Date(sign.iat*1000);

        admin = await Admin.findById(sign._id);
        if(admin)
        {
            if ( admin.tokenGeneratedAt.getTime() === jwtDate.getTime() )
            {
                req.admin = admin;
                next();
            }
            else
            {
                return res.status(400).send("Session Expired")
            }
        }
        else
        {
            return res.status(400).send("Invalid Token")
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(401).send("PLease Login");
    }
    
};