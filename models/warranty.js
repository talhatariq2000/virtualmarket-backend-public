const { number } = require("joi");
const mongoose = require("mongoose");
const Joi = require("joi");

warrantySchema = mongoose.Schema({
    _id: String,
    Buyer: { type: String, ref: "Buyer" },
    Product: { type: String, ref: "Product" },
    Seller: { type: String, ref: "Seller" },
    productName: String,
    Order: { type: String, ref: "Order" },
    quantity: Number,
    expiry: Date,
    status: { type: String, enum : ['IN-WARRANTY', 'REQUESTED', 'REPAIRED', 'REPLACED', 'RETURNED', 'DENIED', 'PENDING', 'EXPIRED'] },
    events: [
        {
            name: { type: String },
            comment: String,
            date: Date 
        }
    ],
    buyerComment: String,
    sellerComment: String,
    adminComment: String,
    createdAt: { type: Date, required: true }
});
var Warranty = mongoose.model("Warranty",warrantySchema);

//Validate Input for Warranty Claim
function validateInput(data) {
    const schema = Joi.object({

        comment: Joi
        .string()
        .max(1000).message("Comment cannot be longer than 1000 Characters")
        .required()
        .messages({
            'any.required': 'Comment is Required',
            'string.empty': 'Comment is Required',
        })


    });
    return schema.validate(data);
};

module.exports.validateInput = validateInput;

module.exports.Warranty = Warranty;