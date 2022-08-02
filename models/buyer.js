const mongoose = require("mongoose");
const Joi = require("joi");
const { max } = require("lodash");

buyerSchema = mongoose.Schema({
    _id: String,
    fName: { type: String, trim: true },
    lName: { type: String, trim: true },
    email: { type: String, unique: true },
    phone: String,
    password: String,
    address: String,
    city: { type: String, ref: "City" },
    otp: String,
    otpExpiry: Date,
    avatar: { type: String, default: 'https://res.cloudinary.com/ddpdr9nvh/image/upload/v1647162487/blankProfilePic_gbdntn.png'},
    cloudinaryID: String,
    emailVerified: { type: Boolean, required: true, default: false },
    infoCompleted: { type: Boolean, required: true, default: false },
    blocked: { type: Boolean, required: true, default: false },
    adminName: String,
    adminComment: String,
    events: [
        {
            date: Date,
            name: String,
            adminName: String,
            adminComment: String 
        }
    ],
    createdAt: Date,
    verificationToken: String,
});
var Buyer = mongoose.model("Buyer",buyerSchema);


function validateBuyerSignup(data) {
    const schema = Joi.object({


        email: Joi
        .string()
        .email()
        .required(),
        
        password: Joi
        .string()
        .min(5).message('Password must contain at least 5 Characters')
        .max(15).message('Password cannot be more than 15 Characters')
        .required(),

        confirmPassword: Joi.required()
    });
    return schema.validate(data);
};

function validateBuyerLogin(data) {
    const schema = Joi.object({

        email: Joi
        .string()
        .email()
        .required(),
        
        password: Joi.required()
    });
    return schema.validate(data);
};

function validateBuyerDetails(data) {
    const schema = Joi.object({

        fName: Joi
        .string()
        .max(15).message("First Name cannot be longer than 15 Characters")
        .required()
        .messages({
            'any.required': 'First Name is Required',
            'string.empty': 'First Name is Required',
        }),
        
        lName: Joi
        .string()
        .max(15).message("Last Name cannot be longer than 15 Characters")
        .required()
        .messages({
            'any.required': 'Last Name is Required',
            'string.empty': 'Last Name is Required',
        }),

        address: Joi
        .string()
        .max(300).message("Address cannot be longer than 300 Characters")
        .required(),

        phone: Joi
        .string()
        //.min(11).message("Invalid Mobile Number")
        //.max(11).message("Invalid Mobile Number")
        .pattern(new RegExp('^(0)(3)([0-9]{9})$')).message('Invalid Mobile Number')
        .required(),

        city: Joi
        .string()
        .required()
    });
    return schema.validate(data);
};

function validateBuyerChangeStatus(data) {
    const schema = Joi.object({

        status: Joi
        .string()
        .required(),
        
        reason: Joi
        .string()
        .required()
    });
    return schema.validate(data);
};

module.exports.validateBuyerSignup = validateBuyerSignup;
module.exports.validateBuyerLogin = validateBuyerLogin;
module.exports.validateBuyerDetails = validateBuyerDetails;
module.exports.validateBuyerChangeStatus = validateBuyerChangeStatus;

module.exports.Buyer = Buyer;