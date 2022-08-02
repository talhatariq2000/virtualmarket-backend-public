var mongoose = require("mongoose");
const Joi = require("joi");

favouriteSchema = mongoose.Schema({
    _id: String,
    Buyer: { type: String, required: true, ref: "Buyer" },
    products: [
        { type: String, required: true, ref: "Product" }
    ]
});

var Favourite = mongoose.model("Favourite",favouriteSchema);


module.exports.Favourite = Favourite;