const getProductObject = async (product, detailed) => {
    await product.populate('store_id created_by').execPopulate();
    
    let obj = {
        _id: product._id,
        name: product.name,
        description: product.description,
        image_url: product.image_url,
        price: product.price,
        store: { 
            _id: product.store_id?._id,
            name: product.store_id?.name
        }        
    }

    if (detailed) {
        obj = {
            ...obj,
            created_by: {
                _id: product.created_by?._id,
                name: product.created_by?.name,
                email: product.created_by?.email
            },
            created_at: product.created_at,
        }
    }

    return obj;
}

module.exports = {
    getProductObject
}