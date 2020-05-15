const mongoose = require('mongoose');
const { User } = require('../src/models')



// global.console = {
//     log: jest.fn(), // console.log are ignored in tests
  
//     // Keep native behaviour for other methods, use those to print out things in your own tests, not `console.log`
//     error: jest.fn(),
//     warn: jest.fn(),
//     info: jest.fn(),
//     debug: jest.fn(),
// };

const setupTestDB = () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost/ss-product-test', { 
        useUnifiedTopology: true,
        useNewUrlParser: true
    });
    // await Promise.all(Object.values(mongoose.connection.collections).map(async (collection) => collection.deleteMany()));
  });

  afterAll(async () => {
    await Promise.all(Object.values(mongoose.connection.collections).map(async (collection) => collection.deleteMany()));
    await mongoose.disconnect();
  });
};

// let userToken
let manager1 = { 
    name: 'test user', 
    email: 'test@example.com',
    password: '123456'
}

let staff1 = { 
    name: 'Staff 1',
    email: 'staff1@example.com',
    password: '123456'
}

let user1 = { 
    name: 'User 1',
    email: 'user1@example.com',
    password: '123456'
}

const getManagerToken = async () => {
    if (manager1.token) return manager1.token;

    let user = await User.create(manager1);
    user.setPassword(manager1.password);
    await user.save();

    manager1.token = await user.generateJwt();
    return manager1.token;
}

const getStaffToken = async () => {
    if (staff1.token) return staff1.token;

    let user = await User.create(staff1);
    user.setPassword(staff1.password);
    await user.save();

    staff1.token = await user.generateJwt();
    return staff1.token;
}

const getUserToken = async () => {
    if (user1.token) return user1.token;
    
    let user = await User.create(user1);
    user.setPassword(user1.password);
    await user.save();

    user1.token = await user.generateJwt();
    return user1.token;
}

module.exports = {
    setupTestDB,
    getManagerToken,
    getStaffToken,
    getUserToken
};
