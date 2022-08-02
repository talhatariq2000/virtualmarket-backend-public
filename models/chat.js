const mongoose = require("mongoose");

chatSchema = mongoose.Schema({
    _id: String,
    Buyer: { type: String, ref: "Buyer" },
    Seller: { type: String, ref: "Seller" },
    lastUpdated: { type: Date, default: new Date() },
    lastMessage: { type: String },
    buyerRead: { type: Boolean, default: true },
    sellerRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: new Date() }
});

var Chat = mongoose.model("Chat",chatSchema);

module.exports.Chat = Chat;