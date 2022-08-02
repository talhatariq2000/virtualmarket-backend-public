const sellers = require("../dummyData/sellers.json");
const {Seller} = require("../models/seller");

const seedSellers = async() => {
    try
    {
        const data = sellers.data;
        await Seller.insertMany(data);
        console.log("Seller Dummy Data Seeded...");
    }
    catch(err)
    {
        console.log('Seller Seeding Error:',err.message)
    }
};

module.exports = seedSellers;