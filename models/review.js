var mongoose = require("mongoose");
const Joi = require("joi");

reviewSchema = mongoose.Schema({
    _id: String,
    Product: { type: String, ref: 'Product' },
    Buyer: { type: String, ref: 'Buyer' },
    Order: { type: String, ref: 'Order' },
    rating: Number,
    comment: String,
    createdAt: Date
});
var Review = mongoose.model("Review",reviewSchema);


//Validate Review Inputs
function validateReview(data) {
    const schema = Joi.object({

        rating: Joi
        .number()
        .max(5).message("Maximum Rating can be 5")
        .min(0).message("Minimum Rating can be 0")
        .required(),

        comment: Joi
        .string()
        .max(100).message("Comment cannot be longer than 100 Characters")
        .required()
        .messages({
            'any.required': 'Comment is Required',
            'string.empty': 'Comment is Required',
        })
    });
    return schema.validate(data);
};

function validateReviewRatingOnly(data) {
    const schema = Joi.object({

        rating: Joi
        .number()
        .max(5).message("Maximum Rating can be 5")
        .min(0).message("Minimum Rating can be 0")
        .required(),
        
    });
    return schema.validate(data);
};

module.exports.validateReview = validateReview;
module.exports.validateReviewRatingOnly = validateReviewRatingOnly;

module.exports.Review = Review;