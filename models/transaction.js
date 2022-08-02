const mongoose = require("mongoose");
var Joi = require("joi");

transactionSchema = mongoose.Schema({
    _id: String,
    stripeTransactionID: String,
    amount: Number,
    Order: { type: String, ref: "Order" },
    Seller:  { type: String, ref: "Seller" },
    Buyer: { type: String, ref: "Buyer" },
    status: { type: String, enum : ['DELIVERY-PENDING', 'PROCESSING', 'COMPLETED', 'PENDING-REFUND', 'REFUNDED', 'PENDING-WITHDRAWAL', 'WITHDRAWN', 'DENIED-WITHDRAWAL', 'DEDUCTED'] },
    accountDetails: {
        accountNumber: String,
        accountTitle: String,
        bankTitle: String
    },
    createdAt: Date,
    requestedBy: String,
    adminComment: String,
    adminName: String,
    holdTill: Date
});
var Transaction = mongoose.model("Transaction",transactionSchema);

function validateWithdrawalDetails(data) {
    const schema = Joi.object({

        amount: Joi
        .number()
        .min(1000)
        .required()
        .messages({
            'any.required': 'Amount is Required',
            'string.empty': 'Amount is Required',
        }),
    });
    return schema.validate(data);
};

function validateWithdrawalResponse(data) {
    const schema = Joi.object({

        stripeTransactionID: Joi
        .string()
        .required()
        .messages({
            'any.required': 'Trx ID is Required',
            'string.empty': 'Trx ID is Required',
        })

    });
    return schema.validate(data);
};

module.exports.validateWithdrawalDetails = validateWithdrawalDetails;
module.exports.validateWithdrawalResponse = validateWithdrawalResponse;

module.exports.Transaction = Transaction;