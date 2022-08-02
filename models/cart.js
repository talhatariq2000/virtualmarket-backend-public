const mongoose = require("mongoose");
const { Schema } = mongoose;

cartSchema = mongoose.Schema({
    _id: String,
    buyer: { type: String, required: true, ref: "Buyer" },
    seller: { type: String, required: true, ref: "Seller" },
    items: [
        { 
            product: { type: String, ref: "Product"},
            deal: { type: String, ref: "Deal" },
            offer: { type: String, ref: "Offer" },
            type: { type: String, enum : ['DEFAULT','DEAL', 'OFFER'] },
            quantity: Number
        }
    ]
});

var Cart = mongoose.model("Cart",cartSchema);

module.exports.Cart = Cart;