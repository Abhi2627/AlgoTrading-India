const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema({
    symbol: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    averagePrice: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 }
});

const transactionSchema = new mongoose.Schema({
    type: { type: String, enum: ['BUY', 'SELL'], required: true },
    symbol: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    timestamp: { type: Date, default: Date.now }
});

const portfolioSchema = new mongoose.Schema({
    userId: { type: String, default: 'default-user' },
    capital: { type: Number, required: true, min: 0 },
    holdings: [holdingSchema],
    transactions: [transactionSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

portfolioSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Portfolio', portfolioSchema);