const products = require("../dummyData/products.json");
const {Product} = require("../models/product");

const seedProducts = async() => {
    try
    {
        const data = products.data;
        await Product.insertMany(data);
        console.log("Product Dummy Data Seeded...");
    }
    catch(err)
    {
        console.log('Product Seeding Error:',err.message)
    }
};

module.exports = seedProducts;