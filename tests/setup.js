const mongoose = require('mongoose');
const { User } = require('../src/models')

// ignore console.log when testing
global.console = {
    log: jest.fn(), 
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
};

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

const setupTestDB = () => {
  beforeAll(async (done) => {
    await mongoose.connect('mongodb://localhost/ss-product-test', { 
        useUnifiedTopology: true,
        useNewUrlParser: true
    });

    //create manager
    let manager = await User.create(manager1);
    manager.setPassword(manager1.password);
    await manager.save();

    manager1._id = manager._id;
    manager1.token = await manager.generateJwt();

    // create staff
    let staff = await User.create(staff1);
    staff.setPassword(staff1.password);
    await staff.save();

    staff1._id = staff._id;
    staff1.token = await staff.generateJwt();

    // create user
    let user = await User.create(user1);
    user.setPassword(user1.password);
    await user.save();

    user1._id = user._id
    user1.token = await user.generateJwt();

    done()
    // await Promise.all(Object.values(mongoose.connection.collections).map(async (collection) => collection.deleteMany()));
  });

  afterAll(async (done) => {
    await Promise.all(Object.values(mongoose.connection.collections).map(async (collection) => collection.deleteMany()));
    await mongoose.connection.close()
    done();
  });
};

const getManagerToken = () => {
    return manager1.token;
}

const getStaffToken = () => {
    return staff1.token;
}

const getUserToken = () => {
    return user1.token;
}

module.exports = {
    setupTestDB,
    getManagerToken,
    getStaffToken,
    getUserToken,
    getManager: () => manager1,
    getStaff: () => staff1,
    getUser: () => user1
};
