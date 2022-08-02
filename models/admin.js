const mongoose = require("mongoose");
const Joi = require("joi");
const { max } = require("lodash");

adminSchema = mongoose.Schema({
    _id: String,
    name: { type: String, trim: true },
    username: { type: String, trim: true },
    email: { type: String, unique: true },
    otp: String,
    otpExpiry: Date,
    tokenGeneratedAt: Date
});
var Admin = mongoose.model("Admin",adminSchema);


function validateAdminSignup(data) {
    const schema = Joi.object({

        name: Joi
        .string()
        .max(15).message("First Name cannot be longer than 15 Characters")
        .required()
        .messages({
            'any.required': 'Name is Required',
            'string.empty': 'Name is Required',
        }),

        username: Joi
        .string()
        .max(20).message("Username cannot be longer than 20 Characters")
        .min(5).message("Username cannot be longer than 10 Characters")
        .required()
        .messages({
            'any.required': 'Username is Required',
            'string.empty': 'Username is Required',
        }),

        email: Joi
        .string()
        .email()
        .required(),
    });
    return schema.validate(data);
};

function validateAdminLogin(data) {
    const schema = Joi.object({

        email: Joi
        .string()
        .email()
        .required(),
        
        otp: Joi.required()
    });
    return schema.validate(data);
};


module.exports.validateAdminSignup = validateAdminSignup;
module.exports.validateAdminLogin = validateAdminLogin;

module.exports.Admin = Admin;