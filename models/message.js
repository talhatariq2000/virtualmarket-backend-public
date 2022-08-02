const mongoose = require("mongoose");
var Joi = require("joi");

messageSchema = mongoose.Schema({
    _id: String,
    sender: { type: String, enum : ['BUYER', 'SELLER'] },
    Chat: { type: String, ref: "Chat" },
    type: { type: String, enum : ['TEXT', 'OFFER', 'IMAGE'] },
    content: { type: String, trim: true },
    Offer: { type: String, ref: "Offer" },
    createdAt: { type: Date, default: new Date() }
});
var Message = mongoose.model("Message",messageSchema);


//Validate Message Inputs
function validateContent(data) {
    const schema = Joi.object({

        content: Joi
        .string()
        .min(1).message("Message Content is Required")
        .max(500).message("Message cannot be longer than 500 Characters")
        .required()
        .messages({
            'any.required': 'Message Content is Required',
            'string.empty': 'Message Content is Required',
        })


    });
    return schema.validate(data);
};

module.exports.validateContent = validateContent;

module.exports.Message = Message;