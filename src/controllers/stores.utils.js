const { getProductObject } = require('./products.utils')

const getStoreObject = async (store, detailed) => {
    console.log(store._id, detailed)
    await store.populate('products manager staff').execPopulate();

    let products = []
    for (p of store.products) {
        products.push(await getProductObject(p))
    }

    let obj = {
        _id: store._id,
        name: store.name,
        products,
    }

    if (detailed) {
        obj = {
            ...obj,
            created_at: store.created_at,
            manager: store.manager,
            staff: store.staff
        }
    }

    return obj;
}

module.exports = {
    getStoreObject
}