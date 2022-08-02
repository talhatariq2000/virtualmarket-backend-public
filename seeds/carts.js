const carts = require("../dummyData/carts.json");
const {Cart} = require("../models/cart");

const seedCarts = async() => {
    try
    {
        const data = carts.data;
        await Cart.insertMany(data);
        console.log("Cart Dummy Data Seeded...");
    }
    catch(err)
    {
        console.log('Cart Seeding Error:',err.message)
    }
};

module.exports = seedCarts;