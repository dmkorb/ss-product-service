const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    created_at: { type: Date, default: Date.now },
    name: { type: String, required: true },
    description: { type: String },
    image_url: { type: String }
})

module.exports = mongoose.model('Product', productSchema);