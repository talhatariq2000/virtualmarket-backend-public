var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require("cors");
const dotenv = require("dotenv").config();

const mongoose = require("mongoose");
const config = require("config");
const schedule = require("node-schedule");

var warrantyController = require("./controllers/warranties");
var offerController = require("./controllers/offers");
var scheduledOrderController = require("./controllers/scheduledOrders");
var transactionController = require("./controllers/transactions");


var indexRouter = require('./routes/index');

var adminsRouter = require('./routes/api/admins');
var buyersRouter = require('./routes/api/buyers');
var cartsRouter = require('./routes/api/carts');
var chatsRouter = require('./routes/api/chats');
var categoriesRouter = require('./routes/api/categories');
var citiesRouter = require('./routes/api/cities');
var favouritesRouter = require('./routes/api/favourites');
var messagesRouter = require('./routes/api/messages');
var offersRouter = require('./routes/api/offers')
var ordersRouter = require('./routes/api/orders');
var productsRouter = require('./routes/api/products');
var reviewsRouter = require('./routes/api/reviews');
var sellersRouter = require('./routes/api/sellers');
var scheduledOrdersRouter = require('./routes/api/scheduledOrders');
var transactionsRouter = require('./routes/api/transactions');
var warrantiesRouter = require('./routes/api/warranties');

var app = express();
app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


//routes
app.use('/api/admins', adminsRouter);
app.use('/api/buyers', buyersRouter);
app.use('/api/carts', cartsRouter);
app.use('/api/chats', chatsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/cities', citiesRouter);
app.use('/api/favourites', favouritesRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/offers', offersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/products', productsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/sellers', sellersRouter);
app.use('/api/scheduledOrders', scheduledOrdersRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/warranties', warrantiesRouter);

//Invalid
app.use('*', indexRouter);


//Local mongoose connection
// mongoose
//   .connect("mongodb://localhost/vmdb1", {useNewUrlParser : true, useUnifiedTopology: true})
//   .then(() => console.log("Connected to MongoDB-vmdb1..."))
//   .catch((error) => console.log(error.message))
// ;

//Cloud mongoose connection VMDBx
mongoose
  .connect(process.env.MONGO_VMDB2, {useNewUrlParser : true, useUnifiedTopology: true})
  .then(() => console.log("Connected to Cloud-MongoDB-vmdb2..."))
  .catch((error) => console.log(error))
;


//Update Expired Warranties Daily @ 19:00 GMT  0 0 * * *
//For testing */2 * * * * *
schedule.scheduleJob('updateExpiredWarranties', '0 0 * * *', warrantyController.updateExpired);

//Execute Scheduled Orders Every Hour at 1 Minute  1 * * * *
//Every Minute at 30 sec 30 0-59 * * * *
schedule.scheduleJob('executeScheduledOrders', '5 0-59 * * * *', scheduledOrderController.addToCart);

//Execute Scheduled Orders Every Hour at 1 Minute  1 * * * *
//Every Minute at 30 sec 30 0-59 * * * *
schedule.scheduleJob('updateExpiredOffers', '5 0-59 * * * *', offerController.updateExpired);

//Execute Scheduled Orders Every Day at 00:00  0 0 * * *
//Every Minute at 30 sec 30 0-59 * * * *
schedule.scheduleJob('updateProcessedTransactions', '0 0 * * *', transactionController.concludeOrderTransaction);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
