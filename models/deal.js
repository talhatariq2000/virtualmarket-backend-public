var mongoose = require("mongoose");

dealSchema = mongoose.Schema({
    _id: String,
    productID: String,
    quantity: Number,
    price: Number,
});

var Deal = mongoose.model("Deal",dealSchema);

module.exports.Deal = Deal;