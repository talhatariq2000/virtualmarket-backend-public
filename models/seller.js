var mongoose = require("mongoose");
var Joi = require("joi");
const { object } = require("joi");

sellerSchema = mongoose.Schema({
    _id: String,
    fName: { type: String, trim: true },
    lName: { type: String, trim: true },
    cnicNumber: String,
    cnicImages: [
        { link: String, cloudinaryID: String }
    ],
    email: { type: String, unique: true },
    password: String,
    storeName: String,
    address: String,
    city: { type: String, ref: "City" },
    phone: String,
    onlinePaymentOption: Boolean,
    balance: { type: Number, default: 0, required: true },
    sameCityDeliveryCharge: Number,
    diffCityDeliveryCharge: Number,
    otp: String,
    otpExpiry: Date,
    emailVerified: { type: Boolean, required: true, default: false },
    status: { type: String, enum : ['NEW', 'PENDING', 'REJECTED', 'APPROVED'] },
    //infoCompleted: { type: Boolean, required: true, default: false },
    blocked: { type: Boolean, required: true, default: false },
    adminName: String,
    adminComment: String,
    avatar: { link: String, cloudinaryID: String },
    createdAt: Date,
    events: [
        {
            date: Date,
            name: String,
            adminName: String,
            adminComment: String 
        }
    ],
    ntn: String,
    billImages: [
        { link: String, cloudinaryID: String }
    ],
    accountStatement: { link: String, cloudinaryID: String },
    accountDetails: {
        accountNumber: String,
        accountTitle: String,
        bankTitle: String
    },
    advancePayment: Boolean,
    advancePaymentAmount: Number,
    advancePaymentCriteria: Number,
    hold: Boolean
});
var Seller = mongoose.model("Seller",sellerSchema);


function validateSellerSignup(data) {
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

        confirmPassword: Joi.required(),

        terms: Joi
        .boolean()
        .invalid(false)
        .required()
        .messages({
            'any.invalid': 'Please agree to the Terms and Conditions',
            'any.required': 'Please agree to the Terms and Conditions',
            'string.empty': 'Please agree to the Terms and Conditions',
        })

    });
    return schema.validate(data);
};

function validateSellerLogin(data) {
    const schema = Joi.object({

        email: Joi
        .string()
        .email()
        .required(),
        
        password: Joi.required()
    });
    return schema.validate(data);
};

function validateSellerAddDetails(data) {
    const schema = Joi.object({

        fName: Joi
        .string()
        .required()
        .messages({
            'any.required': 'First Name is Required',
            'string.empty': 'First Name is Required',
        }),
        
        lName: Joi
        .string()
        .required()
        .messages({
            'any.required': 'Last Name is Required',
            'string.empty': 'Last Name is Required',
        }),

        cnic: Joi
        .string()
        .pattern(new RegExp('^[0-9+]{13}$')).message('Invalid CNIC')
        .required(),
        
        storeName: Joi
        .string()
        .required(),//.message('Store Name is Required'),

        address: Joi
        .string()
        .required(),

        city: Joi
        .string()
        .required(),

        phone: Joi
        .string()
        .pattern(new RegExp('^(0)(3)([0-9]{9})$')).message('Invalid Mobile Number')
        .required()
        .messages({
            'any.required': 'Mobile Number is Required',
            'string.empty': 'Mobile Number is Required',
        }),

        onlinePaymentOption: Joi
        .boolean()
        .required()
        .messages({
            'any.required': 'Online Payment Field is Required',
            'string.empty': 'Online Payment Field is Required',
        }),

        sameCityDeliveryCharge: Joi
        .number()
        .min(0)
        .required()
        .messages({
            'any.required': 'Same City Delivery Charge is Required',
            'string.empty': 'Same City Delivery Charge is Required',
        }),

        diffCityDeliveryCharge: Joi
        .number()
        .min(0)
        .required()
        .messages({
            'any.required': 'Other Cities Delivery Charge is Required',
            'string.empty': 'Other Cities Delivery Charge is Required',
        }),

        ntn: Joi
        .string()
        .required()
        .messages({
            'any.required': 'NTN is Required',
            'string.empty': 'NTN is Required',
        }),

        advancePayment: Joi
        .boolean()
        .required()
        .messages({
            'boolean.base': 'Advance Payment must be true/false',
            'any.required': 'Advance Payment is Required',
            'string.empty': 'Advance Payment is Required',
        }),
    });
    return schema.validate(data);
};

function validateSellerEditDetails(data) {
    const schema = Joi.object({

        password: Joi.required()
        .messages({
            'any.required': 'Password is Required',
            'string.empty': 'Password is Required',
        }),

        storeName: Joi
        .string()
        .required()
        .messages({
            'any.required': 'Store Name cannot be empty',
            'string.empty': 'Store Name cannot be empty',
        }),

        phone: Joi
        .string()
        .pattern(new RegExp('^(0)(3)([0-9]{9})$')).message('Invalid Mobile Number')
        .required()
        .messages({
            'any.required': 'Phone Number cannot be empty',
            'string.empty': 'Phone Number cannot be empty',
        }),

        onlinePaymentOption: Joi
        .boolean()
        .required()
        .messages({
            'any.required': 'Online Payment Field is Required',
            'string.empty': 'Online Payment Field is Required',
        }),

        sameCityDeliveryCharge: Joi
        .number()
        .min(0)
        .required()
        .messages({
            'any.required': 'Same City Delivery Charge is Required',
            'string.empty': 'Same City Delivery Charge is Required',
        }),

        diffCityDeliveryCharge: Joi
        .number()
        .min(0)
        .required()
        .messages({
            'any.required': 'Other Cities Delivery Charge is Required',
            'string.empty': 'Other Cities Delivery Charge is Required',
        }),

        advancePayment: Joi
        .boolean()
        .required()
        .messages({
            'boolean.base': 'Advance Payment must be true/false',
            'any.required': 'Advance Payment is Required',
            'string.empty': 'Advance Payment is Required',
        }),

    });
    return schema.validate(data);
};

function validateSellerChangeStatus(data) {
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

function validateAccountDetails(data) {
    const schema = Joi.object({

        accountNumber: Joi
        .string()
        .required()
        .messages({
            'any.required': 'Account Number is Required',
            'string.empty': 'Account Number is Required',
        }),

        accountTitle: Joi
        .string()
        .required()
        .messages({
            'any.required': 'Account Title is Required',
            'string.empty': 'Account Title is Required',
        }),

        bankTitle: Joi
        .string()
        .required()
        .messages({
            'any.required': 'Bank Name is Required',
            'string.empty': 'Bank Name is Required',
        })
    });
    return schema.validate(data);
};

function validateAdvancePayment(data) {
    const schema = Joi.object({

        advancePaymentAmount: Joi
        .number()
        .min(1).message('Advance Payment Amount cannot be less than 1%')
        .max(100).message('Advance Payment Amount cannot be more than 100%')
        .required()
        .messages({
            'number.base': 'Advance Payment Amount must be a Number between 0-100',
            'any.required': 'Advance Payment Amount is Required',
            'string.empty': 'Advance Payment Amount is Required',
        }),

        advancePaymentCriteria: Joi
        .number()
        .min(1).message('Advance Payment can only be recieved on Orders more than PKR.0')
        .required()
        .messages({
            'number.base': 'Minimum Invoice Amount must be a Number greater than 0',
            'any.required': 'Minimum Invoice Amount is required for Advance Payment',
            'string.empty': 'Minimum Invoice Amount is required for Advance Payment',
        }),
    });
    return schema.validate(data);
};

function validateSellerHold(data) {
    const schema = Joi.object({

        reason: Joi
        .string()
        .required()
    });
    return schema.validate(data);
};

module.exports.validateSellerSignup = validateSellerSignup;
module.exports.validateSellerLogin = validateSellerLogin; 
module.exports.validateSellerAddDetails = validateSellerAddDetails;
module.exports.validateSellerEditDetails = validateSellerEditDetails;
module.exports.validateSellerChangeStatus = validateSellerChangeStatus;
module.exports.validateAccountDetails = validateAccountDetails;
module.exports.validateAdvancePayment = validateAdvancePayment;
module.exports.validateSellerHold = validateSellerHold;

module.exports.Seller = Seller;