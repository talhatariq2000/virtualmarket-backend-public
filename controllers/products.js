const express = require('express');
const mongoose = require("mongoose");
const fs = require('fs');

const cloudinary = require("../utils/cloudinary");

const { Product, validateProduct, validateProductChangeStatus } = require("../models/product");
const scheduledOrderController = require("./scheduledOrders");
const categoryController = require("./categories");
const sellerController = require("./sellers");

//_________________________________________________________________________
//                              Seller APIs
//_________________________________________________________________________

//Add Product
module.exports.add = async (req,res) => {
    
    try
    {
        console.log(req.body);
        if(req.files.length === 0 )
        {
            return res.status(400).send("Please Upload Images for the Product");
        }

        if(!req.files)
        {
            return res.status(400).send("No Product Image Added");
        }

        let product = new Product();
        product.seller = req.seller._id;

        product._id = new mongoose.Types.ObjectId();
        product.name= req.body.name;
        product.brand= req.body.brand;
        product.category= req.body.category;
        product.description= req.body.description;
        product.sampleOrder= req.body.sampleOrder;
        product.stock= Math.floor(req.body.stock);
        product.warrantyPeriod= Math.floor(req.body.warrantyPeriod);
        product.minOrder= Math.floor(req.body.minOrder);
        product.price= Math.floor(req.body.price);
        product.status = 'PENDING';
        product.createdAt= new Date();
        product.events.push({date: product.createdAt, name: 'Created'});
        

        const urls = [];
        const files = req.files;

        if(files.length > 5)
        {
            return res.status(400).send("Only 5 Images Allowed");
        }

        console.log(req.files);
        for(const file of files) 
        {
            const { path } = file;
            var newPath;
            
            try
            {
                newPath = await cloudinary.uploader.upload(path);
            }
            catch
            {
                return res.status(400).send("Please Select a Valid Image");
            }
  
            urls.push({link: newPath.secure_url, cloudinaryID: newPath.public_id});
  
            fs.unlinkSync(path);
        }
        product.images = urls;

        await product.save();
        return res.send("Product Added");
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error")
    }
};

//Get All Seller Products
module.exports.fetchAllBySeller = async (req,res) => {

    try
    {
        const page = req.params.page-1;
        
        if (page<0)
        {
            return res.status(400).send("Invalid Page Number");
        }
        const pageSize = 5;

        let totalProducts = await Product.countDocuments({seller: req.seller._id});
        let products = await Product.find({seller: req.seller._id}).limit(pageSize).skip(pageSize*page).select('name brand stock status images').populate('category');
        
        if(products.length === 0)
        {
            return res.status(400).send("No Products Found");
        }

        return res.json({pages: Math.ceil(totalProducts/pageSize), products});
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }

};

//Get Details of a Product for Seller
module.exports.fetchDetailsforSeller = async (req,res) => {

    try
    {
        let product = await Product.findOne({_id: req.params.id, seller: req.seller._id}).populate('category');

        if(!product)
        {
            return res.status(400).send("Product not found");
        }
        else
        {
            return res.send(product);
        }
    }
    catch(err)
    {
        console.log(err)
        return res.status(500).send("Internal Server Error");
    }
};

//Edit Product Details
module.exports.editProductDetails = async (req,res) => {

    try
    {
        console.log(req.body);
        let { error } = validateProduct(req.body);
        if(error)
        {
            return res.status(400).send(error.details[0].message);
        }
            
        let status = await Product.findOneAndUpdate({_id: req.params.id, seller: req.seller._id}, {
            name: req.body.name,
            brand: req.body.brand,
            category: req.body.category,
            description: req.body.description,
            sampleOrder: req.body.sampleOrder,
            stock: Math.floor(req.body.stock),
            warrantyPeriod: Math.floor(req.body.warrantyPeriod), //Days
            minOrder: Math.floor(req.body.minOrder),
            price: Math.floor(req.body.price),
            status: 'PENDING',
            $push: { events: {name: 'Details Edited', date: new Date()}}
        });
        if(status)
        {
            scheduledOrderController.updateDeleted(status._id, status.name, status.seller.storeName);
            return res.send("Product Updated");
        }
        else
        {
            return res.status(401).send("Unauthorized");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//delete Product Image
module.exports.delImg = async (req,res) => {

    try
    {
        console.log(req.body);
        let product = await Product.findOne({_id: req.params.id, seller: req.seller._id}).lean();
        if ( product )
        {
            if( product.images.length <= 1 )
            {
                return res.status(400).send("Cannot Delete All Images");
            }
            else
            {
                for( index=0; index<product.images.length; index++ )
                {
                    if ( product.images[index].cloudinaryID === req.body.cloudinaryID )
                    {
                        try
                        {
                            await cloudinary.uploader.destroy(req.body.cloudinaryID);
                        }
                        catch(err)
                        {
                            console.log("Preloaded Image");
                            console.log(err);
                        }
                        product.images.splice(index,1);
                        await Product.findByIdAndUpdate(product._id, { images: product.images });
                        return res.send("Image Deleted");
                    }
                }
                return res.status(400).send("Invalid Cloudinary ID");
            }
        }
        else
        {
            return res.status(400).send("Product not found");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//add Product Image
module.exports.addImg = async (req,res) => {

    try
    {
        let product = await Product.findOne({_id: req.params.id, seller: req.seller._id});
        if( product )
        {
            if( product.images.length >= 5 )
            {
                return res.status(400).send("Only 5 Images Allowed");
            }
            else
            {
                try
                {
                    result = await cloudinary.uploader.upload(req.file.path);
                }
                catch(err)
                {
                    console.log(err);
                    return res.status(400).send("Please Select a Valid Image");
                }
                product.images.push({link: result.secure_url, cloudinaryID: result.public_id});
                await Product.findByIdAndUpdate(product._id, { images: product.images, status: 'PENDING', $push: { events: {name: 'Image Added', date: new Date()}} });
                return res.send("Image Updated");
            }
        }
        else
        {
            return res.status(400).send("Product not found");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Delete Product
module.exports.del = async (req,res) => {

    try
    {
        console
        let product = await Product.findOne({_id: req.params.id, seller: req.seller._id}).populate('seller', 'storeName');
        if(product)
        {
            for(image of product.images)
            {
                try
                {
                    await cloudinary.uploader.destroy(image.cloudinaryID);
                }
                catch{}
            }
            scheduledOrderController.updateDeleted(product._id, product.name, product.seller.storeName);
            await Product.findByIdAndDelete(req.params.id);
            return res.send("Product Deleted");
        }
        else
        {
            return res.status(400).send("Unauthorized");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Update Stock of a Product
module.exports.changeStock = async (req,res) => {

    try
    {
        if (req.body.stock>0)
        {
            if (req.body.stock<1000000)
            {
                let product = await Product.findOneAndUpdate({_id: req.params.id, seller: req.seller._id}, {stock: Math.floor(req.body.stock)});
                if (product)
                {
                    return res.send("Stock Updated");    
                }
                else
                {
                    return res.status(400).send("Unauthorized");
                }
            }
            else
            {
                return res.status(400).send("Stock cannot be greater than 999999 Pcs");    
            }
        }
        else
        {
            return res.status(400).send("Stock cannot be Less than Zero");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//_________________________________________________________________________
//                              Buyer APIs
//_________________________________________________________________________

//Get All Products (id, name, price and image)
module.exports.search = async (req,res) => {
    try
    {
        let category = await categoryController.getCategoryID(req.params.key);
        let seller = await sellerController.getSellerID(req.params.key);
        
        let products = await Product.find({
            status: 'APPROVED',
            $or:[
                { "name": {$regex: req.params.key,$options:'i'} },
                { "brand": {$regex: req.params.key,$options:'i'} },
                { "category": category },
                { "seller": seller }
            ]
        }, 'name images.link price minOrder');
        
        return res.send(products);
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Get 5 Products of a Category
module.exports.fetchFiveByCategory = async (req,res) => {

    try
    {
        let products = await Product.find({ category: req.params.category, status: 'APPROVED'}, 'name images.link price minOrder').limit(5);
        if(products)
        {
            return res.send(products);
        }
        else
        {
            return res.status(400).send("No Products Found");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//GET by Category
module.exports.fetchByCategory = async (req,res) => {

    try
    {
        let products = await Product.find({ category: req.params.category, status: 'APPROVED' }, 'name images.link price minOrder');
        if(products)
        {
            return res.send(products);
        }
        else
        {
            return res.status(400).send("No Products Found");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//GET Single Product Details
module.exports.fetchOneDetails = async (req,res) => {

    try
    {
        let product = await Product.findOne({ _id: req.params.id, status: 'APPROVED' }, '-images.cloudinaryID -status').populate({ path : 'seller', select: 'avatar storeName email city sameCityDeliveryCharge diffCityDeliveryCharge advancePayment advancePaymentCriteria advancePaymentAmount phone', populate : {path : 'city'}}).populate('category').lean();
        if(product)
        {
            product.favourite = req.favourite;
            return res.send(product);
        }
        else
        {
            return res.status(400).send("Product not found");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Get products for a Seller
module.exports.fetchByStore = async (req,res) => {

    try
    {
        let products = await Product.find({seller: req.params.id, status: 'APPROVED'}, 'name images.link price minOrder');

        if (products.length===0)
        {
            return res.status(400).send("No Products Found");
        }
        else
        {
            return res.send(products);
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};


//_________________________________________________________________________
//                          Admin APIs
//_________________________________________________________________________

//Get Products List
module.exports.fetchList = async (req,res) => {

    try
    {
        let products = [];
        if (req.params.status ==='ALL')
        {
            products = await Product.find({}, 'name brand status').populate('category', 'name').populate('seller', 'storeName');
        }
        else
        {
            products = await Product.find({status: req.params.status}, 'name brand category status').populate('category', 'name').populate('seller', 'storeName');
        }

        if (products.length===0)
        {
            return res.status(400).send("No Products Found");
        }
        else
        {
            return res.send(products);
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Fetch All Details of a Product
module.exports.fetchAllDetails = async (req,res) => {

    try
    {
        let product = await Product.findById(req.params.id).populate('category').populate('seller', 'storeName');

        if(product)
        {
            return res.send(product);
        }
        else
        {
            return res.status(400).send("Product Not Found");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Get Products List by Seller
module.exports.fetchBySeller = async (req,res) => {

    try
    {
        let products = await Product.find({seller: req.params.id}, 'name brand status price').populate('category', 'name');

        if (products.length===0)
        {
            return res.status(400).send("No Products Found");
        }
        else
        {
            return res.send(products);
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//Change Status of a Product
module.exports.changeStatus = async (req,res) => {

    try
    {
        let product = await Product.findById(req.params.id).populate('seller', 'status storeName');
        
        if ( product )
        {
            if ( req.body.status==='DENIED' )
            {
                if ( product.status==='DENIED' )
                {
                    return res.status(400).send("Product already Unlisted");
                }
                let { error } = validateProductChangeStatus(req.body);
                if(error)
                {
                    return res.status(400).send(error.details[0].message);
                }
                await Product.findByIdAndUpdate(product._id, {status: 'DENIED', adminName: req.admin.name, adminComment: req.body.reason,  $push: { events: {name: 'Denied', date: new Date(), adminName: req.admin.name, adminComment: req.body.reason}}});
                scheduledOrderController.updateDeleted(product._id, product.name, product.seller.storeName);
                return res.send("Product Status Updated");
            }
            else if ( req.body.status==='APPROVED')
            {
                if ( product.status==='APPROVED' )
                {
                    return res.status(400).send("Product already Approved");
                }
                await Product.findByIdAndUpdate(product._id, {status: 'APPROVED', adminName: req.admin.name,  $push: { events: {name: 'Approved', date: new Date(), adminName: req.admin.name}}});
                return res.send("Product Status Updated");
            }
            else
            {
                return res.status(400).send("Invalid Status");
            }
        }
        else
        {
            return res.status(400).send("Product Not Found");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.staus(500).send("Internal Server Error");
    }
};

//Get Products for Dashboard
module.exports.getActiveProducts = async (req,res) => {

    try
    {
        let values = [];
        let nowDate = new Date();

        for (let i=0;i<6;i++)
        {
            let newDate = new Date();
            newDate.setMonth(nowDate.getMonth()-i);

            //Getting Month Names
            let name = newDate.toLocaleString('default', { month: 'short' }) + " " + newDate.getFullYear();

            //Getting New Sellers in the month
            let activeProducts = await Product.countDocuments({createdAt: { $lt: newDate }, status: 'APPROVED'}); 
            
            values.push({
                name: name,
                "Active Products": activeProducts
            })
        }

        // let newArray = [11];
        // for (i=11;i>=0;i--)
        // {
        //     newArray[i]=values[11-i];
        // }

        return res.send(values.reverse());
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};

//_________________________________________________________________________
//                          Internal Functions
//_________________________________________________________________________

//Get Product Details
module.exports.getDetails = async (productID) => {

    try
    {
        let product = await Product.findById(productID).populate('seller', 'storeName');
        return product;
    }
    catch(err)
    {
        console.log("Error Fetching Product Details (Internal Func)");
        console.log(err);
        return;
    }
};

//get Stock for Stock Check
module.exports.getStock = async (productID) => {

    try
    {
        product = await Product.findById(productID, 'stock');
        return stock;
    }
    catch(err)
    {
        console.log("Error Getting Stock (Internal Func)");
        console.log(err);
        return;
    }
};

//Update Stock when Order is placed
module.exports.updateStock = async (productID, quantity) => {

    try
    {
        await Product.findByIdAndUpdate(productID, { $inc: {stock: quantity} });
        console.log('Stock Updated for' + productID);
    }
    catch(err)
    {
        console.log('Error Updating Stock for' + productID);
        console.log(err);
        return;
    }
};

//Update Blocked Seller Products
module.exports.updateBlocked = async (sellerID, status) => {
 
    try
    {
        let products = await Product.find({seller: sellerID}).populate('seller', 'storeName');
        if ( status === 'BLOCKED')
        {
            for (product of products)
            {
                await Product.findByIdAndUpdate(product._id, {status: 'DENIED', adminComment: 'Seller Blocked',  $push: { events: {name: 'Blocked', date: new Date(), adminComment: 'Seller Blocked'}}});
                scheduledOrderController.updateDeleted(product._id, product.name, product.seller.storeName);
            }
        }
        else if ( status === 'UNBLOCKED' )
        {
            await Product.updateMany({seller: sellerID}, {status: 'PENDING', adminComment: 'Seller Unblocked',  $push: { events: {name: 'Pending', date: new Date(), adminComment: 'Seller Unblocked'}}});
        }
        console.log("Products Blocked");
        return;
    }
    catch(err)
    {
        console.log('Error Updating Blocked Seller Products');
        console.log(err);
        return;
    }
};

module.exports.addStockforFailure = async ( quantities ) => {

    try
    {
        console.log(quantities);
        for (quantity of quantities)
        {
            await Product.findByIdAndUpdate(quantity.id, { $inc: {stock: quantity.quantity} });
        }
        console.log('Stock Added for' + productID);
        return;
    }
    catch(err)
    {
        console.log('Error Adding Stock for');
        console.log(err);
        return;
    }
};