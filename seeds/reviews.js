const reviews = require("../dummyData/reviews.json");
const {Review} = require("../models/review");

const seedReviews = async() => {
    try
    {
        const data = reviews.data;
        await Review.insertMany(data);
        console.log("Review Dummy Data Seeded...");
    }
    catch(err)
    {
        console.log('Review Seeding Error:',err.message)
    }
};

module.exports = seedReviews;