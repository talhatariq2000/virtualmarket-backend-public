const nodemailer = require("nodemailer");
const dotenv = require("dotenv").config();

//Configuring Mailer for Outlook
// const transporter = nodemailer.createTransport({

//     host: "smtp-mail.outlook.com", // hostname
//     secureConnection: false, // TLS requires secureConnection to be false
//     port: 587, // port for secure SMTP
//     tls: {
//        ciphers:'SSLv3'
//     },
//     auth: {
//         user: 'email',
//         pass: 'password'
//     }
// });


const transporter = nodemailer.createTransport({

    service: 'gmail',
    auth: {
        user: process.env.email_address,
        pass: process.env.email_password
    }
});


//Buyer Mails
module.exports.newAccount = async ( toAddress ) => {

    const options = {
        from: `"VirtualMarket " <${process.env.email_address}>`,
        to: toAddress,
        subject: "Welcome to VirtualMarket",
        html:   `
                Hi, <br>
                <br>
                Welcome to VirtualMarket. <br>
                <br>
                Please complete your <b>Personal and Address Information</b> from the Profile Section to start shopping. <br>
                <br>
                VirtualMarket Support 
                `
    };  

        await transporter.sendMail(options, function (err, info) {
            if(err){
                console.log(err);
                return;
            }
            console.log(info.response);
    });
};

module.exports.verifyEmail = async ( toAddress, token) => {

    const options = {
        from: `"VirtualMarket " <${process.env.email_address}>`,
        to: toAddress,
        subject: "Verify your email",
        html: `Hello, <br> This email has been generated to verify this email for an account on VirtualMarket. Click <a href="https://virtualmarket-buyer.netlify.app/verify/${token}">here</a> to verify your Account.`
    };  

        await transporter.sendMail(options, function (err, info) {
            if(err){
                console.log(err);
                return;
            }
            console.log(info.response);
    });
};

module.exports.verify = async ( toAddress, otp) => {

    const options = {
        from: `"VirtualMarket " <${process.env.email_address}>`,
        to: toAddress,
        subject: "Verification Code",
        html: 'Hello, <br> This email has been generated to verify this email for an account on VirtualMarket. Use the following Code to verify your Account. <br> Your Code is <br> <h2>'+otp+'</h2><br> This Code is valid for 5 Minutes and will be useless after this time.'
    };  

        await transporter.sendMail(options, function (err, info) {
            if(err){
                console.log(err);
                return;
            }
            console.log(info.response);
    });
};

module.exports.forgotPassword = async ( toAddress, otp) => {

    const options = {
        from: `"VirtualMarket " <${process.env.email_address}>`,
        to: toAddress,
        subject: "Password Reset Request",
        html: 'Hello, <br> This email has been generated because of a Password Reset Request recieved by an account registered on this email. <br> Your OTP is <br> <h2>'+otp+'</h2><br> This OTP is valid for 5 Minutes and will be useless after this time.'
    };  

        await transporter.sendMail(options, function (err, info) {
            if(err){
                console.log(err);
                return;
            }
            console.log(info.response);
            return;
    });
};

//If Product Deleted
module.exports.deletedScheduledOrder = async ( toAddress, productName, storeName, quantity, scheduledTime ) => {

    const options = {
        from: `"VirtualMarket " <${process.env.email_address}>`,
        to: toAddress,
        subject: "Scheduled Item Cancellation",
        html: `Dear Customer, <br>
         You scheduled <b>'${quantity}'</b> Pieces of Product <b>'${productName}'</b> from Seller <b>'${storeName}'</b> for <b>${scheduledTime}</b>.<br>
         This email has been generated to inform you that the above mentioned product is <b>No Longer Available</b> on VirtualMarket and has been removed from your Scheduled Items.<br>
         We are sorry for the inconvenience. <br> <br> VirtualMarket Support`
    };  

        await transporter.sendMail(options, function (err, info) {
            if(err){
                console.log(err);
                return;
            }
            console.log(info.response);
            return;
    });
};

//If Product Out of Stock
module.exports.failedScheduledOrder = async ( toAddress, productName, storeName, quantity ) => {

    const options = {
        from: `"VirtualMarket " <${process.env.email_address}>`,
        to: toAddress,
        subject: "Failed to Add Scheduled Item",
        html: `Dear Customer, <br>
         You scheduled <b>'${quantity}'</b> Pieces of Product <b>'${productName}'</b> from Seller <b>'${storeName}'</b> to be added to your cart.<br>
         This email has been generated to inform you that the above mentioned product is <b>Out of Stock</b> right now and could not be added to your cart.<br>
         We are sorry for the inconvenience. <br> <br> VirtualMarket Support`
    };  

        await transporter.sendMail(options, function (err, info) {
            if(err){
                console.log(err);
                return;
            }
            console.log(info.response);
            return;
    });
};

//If Product Out of Stock
module.exports.scheduledOrderAdded = async ( toAddress, productName, storeName, quantity ) => {

    const options = {
        from: `"VirtualMarket " <${process.env.email_address}>`,
        to: toAddress,
        subject: "Scheduled Item added to Cart",
        html: `Dear Customer, <br>
         You scheduled <b>'${quantity}'</b> Pieces of Product <b>'${productName}'</b> from Seller <b>'${storeName}'</b>.<br>
         The Product has been added to your cart.<br>
         Log on to VirtualMarket and checkout to recieve your order.<br>
         <br> <br> VirtualMarket`
    };  

        await transporter.sendMail(options, function (err, info) {
            if(err){
                console.log(err);
                return;
            }
            console.log(info.response);
            return;
    });
};

module.exports.updatedOrder = async ( orderID, toAddress, storeName, status ) => {

    const options = {
        from: `"VirtualMarket " <${process.env.email_address}>`,
        to: toAddress,
        subject: `Your Order has been ${status}`,
        html: ` Dear Customer, <br>
                Your <b>Order#${orderID}</b> from Seller <b>${storeName}</b> has been <b>${status}</b>.<br>
                <br>
                VirtualMarket Team
                `
    };  

        await transporter.sendMail(options, function (err, info) {
            if(err){
                console.log(err);
                return;
            }
            console.log(info.response);
            return;
    });
};

module.exports.concludedOrder = async ( orderID, toAddress, storeName, status, remarks ) => {

    const options = {
        from: `"VirtualMarket " <${process.env.email_address}>`,
        to: toAddress,
        subject: `Your Order has been ${status}`,
        html: ` Dear Customer, <br>
                <b>Your Order#${orderID}</b> from Seller <b>${storeName}</b> has been <b>${status}</b>.<br>
                ${remarks} <br>
                <br>
                VirtualMarket Team
                `
    };  

        await transporter.sendMail(options, function (err, info) {
            if(err){
                console.log(err);
                return;
            }
            console.log(info.response);
            return;
    });
};


//Admin Mails
module.exports.sendAdminOTP = async ( toAddress, otp) => {

    const options = {
        from: `"VirtualMarket Admin" <${process.env.email_address}>`,
        to: toAddress,
        subject: "One Time Password",
        html: '<h2>'+otp+'</h2>'
    };  

        await transporter.sendMail(options, function (err, info) {
            if(err){
                console.log(err);
                return;
            }
            console.log(info.response);
            return;
    });
};

//Seller Mails

module.exports.newOrderEmail = async ( toAddress ) => {

    const options = {
        from: `"VirtualMarket " <${process.env.email_address}>`,
        to: toAddress,
        subject: "New Order",
        html: 'You have a new Order. <br> <br> Visit VirtualMarket'
    };  

        await transporter.sendMail(options, function (err, info) {
            if(err){
                console.log(err);
                return;
            }
            console.log(info.response);
    });
};