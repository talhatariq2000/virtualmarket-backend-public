const mongoose = require("mongoose");
var Joi = require("joi");

var offerSchema = mongoose.Schema({
    _id: String,
    Product: { type: String, ref: "Product" },
    Buyer: { type: String, ref: "Buyer" },
    quantity: Number,
    price: Number,
    status: { type: String, enum : ['PENDING', 'ACCEPTED', 'REFUSED', 'ADDED', 'EXPIRED'] },
    createdAt: {type: Date, default: new Date() },
    expiry: Date
});
var Offer = mongoose.model("Offer",offerSchema);

//Validate Message Inputs
function validateOffer(data) {
    const schema = Joi.object({

        quantity: Joi
        .number()
        .min(1).message("Quantity cannot be less than 1")
        .required()
        .messages({
            'any.required': 'Please Provide Required Quantity',
            'string.empty': 'Please Provide Required Quantity',
        }),

        price: Joi
        .number()
        .min(1).message("Price cannot be less than PKR. 1")
        .required()
        .messages({
            'any.required': 'Please Provide Offered Price',
            'string.empty': 'Please Provide Offered Price',
        })

    });
    return schema.validate(data);
};

module.exports.validateOffer = validateOffer;

module.exports.Offer = Offer;