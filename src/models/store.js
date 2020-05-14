const mongoose = require('mongoose');

const storeSchema = mongoose.Schema({
    created_at: { type: Date, default: Date.now },
    name: { type: String, required: true },
    products: [{ type: mongoose.Schema.ObjectId, ref: 'Product' }],
    manager: { type: mongoose.Schema.ObjectId, ref: 'User' },
    staff: [{ type: mongoose.Schema.ObjectId, ref: 'User' }]
})

module.exports = mongoose.model('Store', storeSchema);