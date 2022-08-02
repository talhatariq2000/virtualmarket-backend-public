const categories = require("../dummyData/categories.json");
const {Category} = require("../models/category");

const seedCategories = async() => {
    try
    {
        const data = categories.data;
        await Category.insertMany(data);
        console.log("Category Dummy Data Seeded...");
    }
    catch(err)
    {
        console.log('Category Seeding Error:',err.message)
    }
};

module.exports = seedCategories;