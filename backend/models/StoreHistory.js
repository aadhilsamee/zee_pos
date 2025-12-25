const mongoose = require('mongoose');

const StoreHistorySchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StoreProduct',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['add', 'deduct'],
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    adjustmentType: {
        type: String,
        enum: ['units', 'bags'],
        required: true
    },
    unitsPerBag: {
        type: Number,
        default: 1
    },
    totalQuantityAdjusted: {
        type: Number,
        required: true
    },
    costPrice: {
        type: Number,
        required: true
    },
    notes: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('StoreHistory', StoreHistorySchema);
