const { User, Store, Product } = require('../models')

const store = {
    name: 'Melhores ofertas'
}

const users = [
    {
        name: 'Gerente 1',
        email: 'gerente@mail.com',
        password: '123456',
        role: 'manager'
    },
    {
        name: 'Staff 1',
        email: 'staff@mail.com',
        password: '123456',
        role: 'staff'
    }, 
    {
        name: 'Usuario 1',
        email: 'usuario@mail.com',
        password: '123456',
    }
]

const products = [
    {
        name: 'Produto numero 1',
        description: 'Descrição do melhor produto do MUNDO!',
        image_url: 'https://pngimage.net/wp-content/uploads/2018/05/best-product-png-1.png',
        price: 9999
    },
    { 
        name: 'Mais um produto TOP',
        description: 'Descrição do segundo melhor produto do MUNDO!',
        image_url: 'https://pngimage.net/wp-content/uploads/2018/05/best-product-png-2.png',
        price: 9999
    }
]

const insertMockData = async () => {
    try {
        if (await User.find().countDocuments()) {
            console.log("Database is populated")
            return;    
        }

        let s, manager
        for (user of users) {
            // create users
            let u = await User.create(user);
            u.setPassword(user.password);

            if (u.role === 'manager') {
                // create store for manager user
                s = await Store.create({
                    ...store,
                    manager: u._id
                });

                // save user to create products
                manager = u;
            } else if (u.role === 'staff') {
                // add staff user to store 
                await Store.updateOne({ _id: s._id }, { $push: { staff: u._id } })
            }

            await u.save();
        }

        // create products for example store
        for (product of products) {
            await Product.create({
                ...product,
                store_id: s._id,
                created_by: manager._id
            })
        }
        
    } catch (err) {
        console.error(`Error inserting mock data: ${err.message}`)
    }
}

module.exports = { insertMockData }