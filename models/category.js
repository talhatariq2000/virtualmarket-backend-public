const mongoose = require("mongoose");

categorySchema = mongoose.Schema({
    _id: String,
    name: String
});

var Category = mongoose.model("Category",categorySchema);

module.exports.Category = Category;