const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    
    name: { type: String, required: true },
    description: { type: String },
    image_url: { type: String },
    price: { type: Number, default: 0 },

    store_id: { type: mongoose.Schema.ObjectId, ref: 'Store', required: true },
    created_by: { type: mongoose.Schema.ObjectId, ref: 'User', required: true }
})

productSchema.pre('save', function() {
    this.updated_at = new Date();

    this.model('Store')
	.updateOne({_id: this.store_id, products: { $ne: this._id }}, { $push: { products: [this._id] }})
	.catch(err => console.log('Error adding product to store'))
});

productSchema.pre('remove', async function() {
	await this.model('Store')
	.updateOne({_id: this.store_id}, { $pullAll: { products: [this._id] }})
	.catch(err => console.log('Error removing product from store'))
});

module.exports = mongoose.model('Product', productSchema);