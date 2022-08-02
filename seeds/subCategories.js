const subCategories = require("../dummyData/subCategories.json");
const {SubCategory} = require("../models/subCategory");

const seedSubCategories = async() => {
    try
    {
        const data = subCategories.data;
        await SubCategory.insertMany(data);
        console.log("SubCategory Dummy Data Seeded...");
    }
    catch(err)
    {
        console.log('SubCategory Seeding Error:',err.message)
    }
};

module.exports = seedSubCategories;