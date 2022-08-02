const Joi = require("joi");
const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
    _id: String,
    name: String,
    brand: String,
    category: { type: String, ref: "Category" },       //Foreign Key
    description: String,
    seller: { type: String, ref: "Seller" },           //Foreign Key
    sampleOrder: Boolean,
    stock: Number,
    warrantyPeriod: Number, //Days
    minOrder: Number,
    price: Number,         //Rupees
    images : [
        {
            link : String,
            cloudinaryID : String  //ignore
        }
    ],
    approved: { type: Boolean, required: true, default: true },
    status: { type: String, enum : ['PENDING', 'APPROVED', 'DENIED'] },
    adminComment: String,
    adminName: String,
    events: [
        {
            date: Date,
            name: String,
            adminName: String,
            adminComment: String 
        }
    ],
    createdAt: Date
});
var Product = mongoose.model("Product",productSchema);

function validateProduct(data) {
    const schema = Joi.object({

        name: Joi
        .string()
        .required()
        .messages({
            'any.required': 'Name is Required',
            'string.empty': 'Name is Required',
        }),
        
        brand: Joi
        .string()
        .required()
        .messages({
            'any.required': 'Brand Name is Required',
            'string.empty': 'Brand Name is Required',
        }),

        category: Joi
        .string()
        .required()
        .messages({
            'any.required': 'Category Name is Required',
            'string.empty': 'Category Name is Required',
        }),
        
        description: Joi
        .string()
        .required()
        .messages({
            'any.required': 'Product Description is Required',
            'string.empty': 'Product Description is Required',
        }),

        sampleOrder: Joi
        .boolean()
        .required(),
        
        stock: Joi
        .number()
        .min(1).message('Available Stock cannot be 0 Pieces')
        .max(999999).message("Available Stock cannot be more than 999999 Pieces")
        .required()
        .messages({
            'any.required': 'Available Stock is Required',
            'string.empty': 'Available Stock is Required',
        }),

        warrantyPeriod: Joi
        .number()
        .min(1).message('Warranty Period cannot be 0 Days')
        .required()
        .messages({
            'any.required': 'Warranty Period is Required',
            'string.empty': 'Warranty Period is Required',
        }),

        minOrder: Joi
        .number()
        .min(1).message('Minimum Order cannot be 0 Pieces')
        .required()
        .messages({
            'any.required': 'Minimum Order is Required',
            'string.empty': 'Minimum Order is Required',
        }),

        price: Joi
        .number()
        .min(1).message('Price cannot be 0 Rupees')
        .max(999999).message('Products with price more than Rs.999999 not allowed')
        .required()
        .messages({
            'any.required': 'Price is Required',
            'string.empty': 'Price is Required',
        }),
    });
    return schema.validate(data);
};

function validateEditProduct(data) {
    const schema = Joi.object({

        name: Joi
        .string()
        .required()
        .messages({
            'any.required': 'Name is Required',
            'string.empty': 'Name is Required',
        }),

        description: Joi
        .string()
        .required()
        .messages({
            'any.required': 'Product Description is Required',
            'string.empty': 'Product Description is Required',
        }),

        sampleOrder: Joi
        .boolean()
        .required(),
        
        stock: Joi
        .number()
        .min(1).message('Available Stock cannot be 0 Pieces')
        .required()
        .messages({
            'any.required': 'Available Stock is Required',
            'string.empty': 'Available Stock is Required',
        }),

        warrantyPeriod: Joi
        .number()
        .min(1).message('Warranty Period cannot be 0 Days')
        .required()
        .messages({
            'any.required': 'Warranty Period is Required',
            'string.empty': 'Warranty Period is Required',
        }),

        minOrder: Joi
        .number()
        .min(1).message('Minimum Order cannot be 0 Pieces')
        .required()
        .messages({
            'any.required': 'Minimum Order is Required',
            'string.empty': 'Minimum Order is Required',
        }),

        price: Joi
        .number()
        .min(1).message('Price cannot be 0 Rupees')
        .required()
        .messages({
            'any.required': 'Price is Required',
            'string.empty': 'Price is Required',
        })
    });
    return schema.validate(data);
};

function validateProductChangeStatus(data) {
    const schema = Joi.object({

        status: Joi
        .string()
        .required(),
        
        reason: Joi
        .string()
        .required()
    });
    return schema.validate(data);
};

module.exports.validateProduct = validateProduct;
//module.exports.validateEditProduct = validateEditProduct;
module.exports.validateProductChangeStatus = validateProductChangeStatus;
module.exports.Product = Product;