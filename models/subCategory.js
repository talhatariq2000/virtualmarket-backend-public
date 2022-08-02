var mongoose = require("mongoose");

subCategorySchema = mongoose.Schema({
    _id: String,
    categoryID: String,
    name: String
});

var SubCategory = mongoose.model("SubCategory",subCategorySchema);

module.exports.SubCategory = SubCategory;