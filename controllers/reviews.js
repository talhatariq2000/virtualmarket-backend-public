const express = require('express');
const mongoose = require("mongoose");
const _ = require("lodash");

const { Review, validateReview, validateReviewRatingOnly } = require("../models/review");
const orderController = require("./orders");

//Post a Review
module.exports.addReview  = async (req,res) => {

    try
    {
        if (req.body.comment)
        {
            let { error } = validateReview({rating: req.body.rating, comment: req.body.comment});
            if(error)
            {
                return res.status(400).send(error.details[0].message);
            }
        }
        else
        {
            let { error } = validateReviewRatingOnly({rating: req.body.rating});
            if(error)
            {
                return res.status(400).send(error.details[0].message);
            }
        }
        

        let review = new Review();
        
        review._id = new mongoose.Types.ObjectId();
        review.Product = req.body.product;
        review.Buyer = req.buyer._id;
        review.Product = req.product._id;

        review.rating = req.body.rating;
        review.comment = req.body.comment;
        review.createdAt = new Date();

        await review.save();
        orderController.updateReviewed(req.params.id, req.body.item, review._id);

        return res.send("Review Added");
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Get All Reviews of Current Product
module.exports.fetchByProduct = async (req,res) => {

    try
    {
        let reviews = await Review.find({ Product: req.params.id }).populate('Buyer', 'fName lName').sort({'createdAt': -1});;

        let total = 0;
        for ( review of reviews )
        {
            total += review.rating;
        }
        
        if(reviews.length===0)
        {
            return res.status(400).send("No Reviews Yet");
        }
        else
        {
            return res.send({rating: total/reviews.length, total: reviews.length , reviews: reviews});
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};
