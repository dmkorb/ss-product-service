const { User, Store } = require('../models')

const store = {
    name: 'Loja 1'
}

const users = [
    {
        name: 'Gerente 1',
        email: 'gerente@mail.com',
        password: '123456',
        role: 'manager'
    }, 
    {
        name: 'Usuario 1',
        email: 'usuario@mail.com',
        password: '123456',
    }
]

const insertMockData = async () => {
    try {
        if (await User.find().countDocuments()) {
            console.log("Database is populated")
            return;    
        }

        for (user of users) {
            let u = await User.create(user);
            u.setPassword(user.password);

            if (u.role === 'manager') {
                let s = await Store.create({
                    ...store,
                    manager: u._id
                });
                u.store = s._id;
            }

            await u.save();
        }
        
    } catch (err) {
        console.error(`Error inserting mock data: ${err.message}`)
    }
}

module.exports = { insertMockData }