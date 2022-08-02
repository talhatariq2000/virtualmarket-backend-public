var mongoose = require("mongoose");
const Joi = require("joi");

orderSchema = mongoose.Schema({
    _id: String,
    Buyer: { type: String, required: true, ref: "Buyer" },
    Seller: { type: String, required: true, ref: "Seller" },
    items: [
        { 
            productName: String,
            Product: { type: String, ref: "Product"},
            type: { type: String, enum : ['DEFAULT', 'DEAL', 'OFFER', 'SAMPLE'] },
            quantity: Number,
            totalPrice: Number,
            reviewed: { type: Boolean, required: true, default: false },
            Review: { type: String, ref: 'Review' },
        }
    ],
    deliveryCharge: Number,
    total: Number,
    advance: Number,
    cashOnDelivery: Number,
    buyerName: { type: String, trim: true, required: true},
    buyerContact: { type: String, required: true },
    deliveryAddress: { type: String, trim: true, required: true },
    deliveryCity: { type: String, required: true, ref: 'City' },
    status: { type: String, enum : ['PLACED', 'PACKAGING', 'SHIPPING', 'DELIVERED', 'CANCELLED'] },
    createdAt: Date,
    events: [
        {
            name: { type: String, enum : ['PLACED', 'PACKAGING', 'SHIPPING', 'DELIVERED', 'RETURNED', 'CANCELLED'] },
            date: Date 
        }
    ],
    //type: { type: String, enum : ['ADVANCE-PAYMENT', 'ONLINE-PAYMENT'] },
    Transaction: { type: String, ref: "Transaction" },
    specialInstructions: String
});
var Order = mongoose.model("Order",orderSchema);

//Validate Buyer Data for Checkout
function validateBuyerData(data) {
    const schema = Joi.object({

        name: Joi
        .string()
        .max(30).message("Name cannot be longer than 30 Characters")
        .required()
        .messages({
            'any.required': 'Name is Required',
            'string.empty': 'Name is Required',
        }),

        address: Joi
        .string()
        .max(50).message("Address cannot be longer than 50 Characters")
        .required(),

        phone: Joi
        .string()
        .pattern(new RegExp('^(0)(3)([0-9]{9})$')).message('Invalid Mobile Number')
        .required(),

        city: Joi
        .string()
        .required()
    });
    return schema.validate(data);
};

module.exports.validateBuyerData = validateBuyerData;

module.exports.Order = Order;