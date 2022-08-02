var mongoose = require("mongoose");

scheduledOrderSchema = mongoose.Schema({
    _id: String,
    Product: { type: String, ref: 'Product' },
    Buyer: { type: String, ref: 'Buyer' },
    quantity: Number,
    scheduledTime: Date,
    repeat: { type: Boolean, default: false },
    repetitionType: { type: String, enum : ['PRESET', 'CUSTOM'] },
    presetRepetition: { type: String, enum : ['WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'BI-MONTHLY', 'TRI-MONTHLY'] },
    customRepetition: Number,
    createdAt: { type: Date, required: true, default: new Date() }
});

var ScheduledOrder = mongoose.model("ScheduledOrder",scheduledOrderSchema);

module.exports.ScheduledOrder = ScheduledOrder;