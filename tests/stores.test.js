const request = require('supertest');
const httpStatus = require('http-status')
const app = require('../src/app');
const { User, Store } = require('../src/models')
const { 
    setupTestDB, 
    getUserToken,
    getStaffToken,
    getManagerToken
} = require('./setup');

setupTestDB();

let store = {
    _id: undefined,
    name: "Loja teste"
}

describe('Store routes', () => {
    beforeAll(() => console.log = jest.fn())

    describe('GET /api/stores', () => {
        test('should return 200 and no stores', async () => {
            const res = await request(app)
                .get('/api/stores')
                .expect(httpStatus.OK);
            
            expect(res.body).toHaveProperty('count');
            expect(res.body.count).toBe(0)

            expect(res.body).toHaveProperty('stores')
            expect(res.body.stores).toHaveLength(0)
          });
    })

    describe('POST /api/stores', () => {
        test('should return 201 and create a store', async () => {
            let userToken = await getManagerToken();

            const res = await request(app)
                .post('/api/stores')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ name: store.name})
                .expect(httpStatus.CREATED);

            expect(res.body).toHaveProperty('name');
            expect(res.body).toMatchObject({ _id: expect.anything(), name: store.name });

            store._id = res.body._id;
        })

        test('should return 400 and not create a store with no name', async () => {
            let userToken = await getManagerToken();

            const res = await request(app)
                .post('/api/stores')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(httpStatus.BAD_REQUEST);            
        })
    })

    describe('GET /api/stores/:id', () => {
        test('should not find an invalid store', async () => {
            const res = await request(app)
                .get('/api/stores/invalidstoreid')
                .expect(httpStatus.NOT_FOUND)
            
            expect(res.body).toHaveProperty('message')
        })

        test('should return a valid store with no auth', async () => {
            const res = await request(app)
                .get(`/api/stores/${store._id}`)
                .expect(httpStatus.OK)
            
            expect(res.body).toMatchObject({ _id: store._id, name: store.name });
            expect(res.body).not.toHaveProperty('manager')
            expect(res.body).not.toHaveProperty('staff')
            expect(res.body).not.toHaveProperty('created_at')
        })

        test('should return a valid store with details', async () => {
            let userToken = await getManagerToken();

            const res = await request(app)
                .get(`/api/stores/${store._id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(httpStatus.OK)
            
            expect(res.body).toMatchObject({ _id: store._id, name: store.name });
            expect(res.body).toHaveProperty('manager')
            expect(res.body).toHaveProperty('staff')
            expect(res.body).toHaveProperty('created_at')
        })

        test('should return a valid store with no details', async () => {
            let userToken = await getUserToken();

            const res = await request(app)
                .get(`/api/stores/${store._id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(httpStatus.OK)
            
            expect(res.body).toMatchObject({ _id: store._id, name: store.name });
            expect(res.body).not.toHaveProperty('manager')
            expect(res.body).not.toHaveProperty('staff')
            expect(res.body).not.toHaveProperty('created_at')
        })
    })

    describe('POST /api/stores/:id/add-staff', () => {
        test('should not add staff when not defined', async () => {
            let userToken = await getManagerToken();

            const res = await request(app)
                .post(`/api/stores/${store._id}/add-staff`, {})
                .set('Authorization', `Bearer ${userToken}`)
                .expect(httpStatus.BAD_REQUEST)

        })

        test('should add staff ', async () => {
            let userToken = await getManagerToken();
            let staff = await User.create({ name: 'staff', email: 'staff@example.com' });
            console.log('staff', staff.email)
            const res = await request(app)
                .post(`/api/stores/${store._id}/add-staff`)
                .send({user_email: staff.email})
                .set('Authorization', `Bearer ${userToken}`)
                .expect(httpStatus.OK)

            let s = await Store.findById(store._id);
            expect(s).toBeDefined();
            expect(s.staff).toHaveLength(1)
            expect(s.staff).toEqual(expect.arrayContaining([staff._id]))
        })

        test('should not add staff twice', async () => {
            let userToken = await getManagerToken();

            const res = await request(app)
                .post(`/api/stores/${store._id}/add-staff`)
                .send({ user_email: 'staff@example.com' })
                .set('Authorization', `Bearer ${userToken}`)
                .expect(httpStatus.BAD_REQUEST)

            let s = await Store.findById(store._id);
            expect(s.staff).toHaveLength(1)
        })
    })

    describe('DELETE /api/stores', () => {
        test('should not remove without auth', async () => {
            const res = await request(app)
                .delete(`/api/stores/${store._id}`)
                .expect(httpStatus.UNAUTHORIZED)
        })

        test('should not remove store from another user', async () => {
            let user = await User.create({
                name: 'another user',
                email: 'another@user.com',
            });
            user.setPassword('123456');
            await user.save();
            let userToken = await user.generateJwt();

            const res = await request(app)
                .delete(`/api/stores/${store._id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(httpStatus.FORBIDDEN)
        })

        test('should remove store', async () => {
            let userToken = await getManagerToken();
            const res = await request(app)
                .delete(`/api/stores/${store._id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(httpStatus.OK)
        })
    })
    
})
  














// const request = require('supertest');
// const faker = require('faker');
// const httpStatus = require('http-status');
// const app = require('../../src/app');
// const setupTestDB = require('../utils/setupTestDB');
// const { User } = require('../../src/models');
// const { userOne, userTwo, admin, insertUsers } = require('../fixtures/user.fixture');
// const { userOneAccessToken, adminAccessToken } = require('../fixtures/token.fixture');

// setupTestDB();

// describe('User routes', () => {
//   describe('POST /v1/users', () => {
//     let newUser;

//     beforeEach(() => {
//       newUser = {
//         name: faker.name.findName(),
//         email: faker.internet.email().toLowerCase(),
//         password: 'password1',
//         role: 'user',
//       };
//     });

//     test('should return 201 and successfully create new user if data is ok', async () => {
//       await insertUsers([admin]);

//       const res = await request(app)
//         .post('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(newUser)
//         .expect(httpStatus.CREATED);

//       expect(res.body).not.toHaveProperty('password');
//       expect(res.body).toEqual({ id: expect.anything(), name: newUser.name, email: newUser.email, role: newUser.role });

//       const dbUser = await User.findById(res.body.id);
//       expect(dbUser).toBeDefined();
//       expect(dbUser.password).not.toBe(newUser.password);
//       expect(dbUser).toMatchObject({ name: newUser.name, email: newUser.email, role: newUser.role });
//     });

//     test('should be able to create an admin as well', async () => {
//       await insertUsers([admin]);
//       newUser.role = 'admin';

//       const res = await request(app)
//         .post('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(newUser)
//         .expect(httpStatus.CREATED);

//       expect(res.body.role).toBe('admin');

//       const dbUser = await User.findById(res.body.id);
//       expect(dbUser.role).toBe('admin');
//     });

//     test('should return 401 error is access token is missing', async () => {
//       await request(app).post('/v1/users').send(newUser).expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should return 403 error if logged in user is not admin', async () => {
//       await insertUsers([userOne]);

//       await request(app)
//         .post('/v1/users')
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(newUser)
//         .expect(httpStatus.FORBIDDEN);
//     });

//     test('should return 400 error if email is invalid', async () => {
//       await insertUsers([admin]);
//       newUser.email = 'invalidEmail';

//       await request(app)
//         .post('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(newUser)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 400 error if email is already used', async () => {
//       await insertUsers([admin, userOne]);
//       newUser.email = userOne.email;

//       await request(app)
//         .post('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(newUser)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 400 error if password length is less than 8 characters', async () => {
//       await insertUsers([admin]);
//       newUser.password = 'passwo1';

//       await request(app)
//         .post('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(newUser)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 400 error if password does not contain both letters and numbers', async () => {
//       await insertUsers([admin]);
//       newUser.password = 'password';

//       await request(app)
//         .post('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(newUser)
//         .expect(httpStatus.BAD_REQUEST);

//       newUser.password = '1111111';

//       await request(app)
//         .post('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(newUser)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 400 error if role is neither user nor admin', async () => {
//       await insertUsers([admin]);
//       newUser.role = 'invalid';

//       await request(app)
//         .post('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(newUser)
//         .expect(httpStatus.BAD_REQUEST);
//     });
//   });

//   describe('GET /v1/users', () => {
//     test('should return 200 and all users', async () => {
//       await insertUsers([userOne, userTwo, admin]);

//       const res = await request(app)
//         .get('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toBeInstanceOf(Array);
//       expect(res.body).toHaveLength(3);
//       expect(res.body[0]).toEqual({
//         id: userOne._id.toHexString(),
//         name: userOne.name,
//         email: userOne.email,
//         role: userOne.role,
//       });
//     });

//     test('should return 401 if access token is missing', async () => {
//       await insertUsers([userOne, userTwo, admin]);

//       await request(app).get('/v1/users').send().expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should return 403 if a non-admin is trying to access all users', async () => {
//       await insertUsers([userOne, userTwo, admin]);

//       await request(app)
//         .get('/v1/users')
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send()
//         .expect(httpStatus.FORBIDDEN);
//     });

//     test('should correctly apply filter on name field', async () => {
//       await insertUsers([userOne, userTwo, admin]);

//       const res = await request(app)
//         .get('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .query({ name: userOne.name })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toHaveLength(1);
//       expect(res.body[0].id).toBe(userOne._id.toHexString());
//     });

//     test('should correctly apply filter on role field', async () => {
//       await insertUsers([userOne, userTwo, admin]);

//       const res = await request(app)
//         .get('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .query({ role: 'user' })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toHaveLength(2);
//       expect(res.body[0].id).toBe(userOne._id.toHexString());
//       expect(res.body[1].id).toBe(userTwo._id.toHexString());
//     });

//     test('should correctly sort returned array if descending sort param is specified', async () => {
//       await insertUsers([userOne, userTwo, admin]);

//       const res = await request(app)
//         .get('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .query({ sortBy: 'role:desc' })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toHaveLength(3);
//       expect(res.body[0].id).toBe(userOne._id.toHexString());
//     });

//     test('should correctly sort returned array if ascending sort param is specified', async () => {
//       await insertUsers([userOne, userTwo, admin]);

//       const res = await request(app)
//         .get('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .query({ sortBy: 'role:asc' })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toHaveLength(3);
//       expect(res.body[0].id).toBe(admin._id.toHexString());
//     });

//     test('should limit returned array if limit param is specified', async () => {
//       await insertUsers([userOne, userTwo, admin]);

//       const res = await request(app)
//         .get('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .query({ limit: 2 })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toHaveLength(2);
//     });

//     test('should return the correct page if page and limit params are specified', async () => {
//       await insertUsers([userOne, userTwo, admin]);

//       const res = await request(app)
//         .get('/v1/users')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .query({ page: 2, limit: 2 })
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).toHaveLength(1);
//       expect(res.body[0].id).toBe(admin._id.toHexString());
//     });
//   });

//   describe('GET /v1/users/:userId', () => {
//     test('should return 200 and the user object if data is ok', async () => {
//       await insertUsers([userOne]);

//       const res = await request(app)
//         .get(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send()
//         .expect(httpStatus.OK);

//       expect(res.body).not.toHaveProperty('password');
//       expect(res.body).toEqual({
//         id: userOne._id.toHexString(),
//         email: userOne.email,
//         name: userOne.name,
//         role: userOne.role,
//       });
//     });

//     test('should return 401 error if access token is missing', async () => {
//       await insertUsers([userOne]);

//       await request(app).get(`/v1/users/${userOne._id}`).send().expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should return 403 error if user is trying to get another user', async () => {
//       await insertUsers([userOne, userTwo]);

//       await request(app)
//         .get(`/v1/users/${userTwo._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send()
//         .expect(httpStatus.FORBIDDEN);
//     });

//     test('should return 200 and the user object if admin is trying to get another user', async () => {
//       await insertUsers([userOne, admin]);

//       await request(app)
//         .get(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send()
//         .expect(httpStatus.OK);
//     });

//     test('should return 400 error if userId is not a valid mongo id', async () => {
//       await insertUsers([admin]);

//       await request(app)
//         .get('/v1/users/invalidId')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send()
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 404 error if user is not found', async () => {
//       await insertUsers([admin]);

//       await request(app)
//         .get(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send()
//         .expect(httpStatus.NOT_FOUND);
//     });
//   });

//   describe('DELETE /v1/users/:userId', () => {
//     test('should return 204 if data is ok', async () => {
//       await insertUsers([userOne]);

//       await request(app)
//         .delete(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send()
//         .expect(httpStatus.NO_CONTENT);

//       const dbUser = await User.findById(userOne._id);
//       expect(dbUser).toBeNull();
//     });

//     test('should return 401 error if access token is missing', async () => {
//       await insertUsers([userOne]);

//       await request(app).delete(`/v1/users/${userOne._id}`).send().expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should return 403 error if user is trying to delete another user', async () => {
//       await insertUsers([userOne, userTwo]);

//       await request(app)
//         .delete(`/v1/users/${userTwo._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send()
//         .expect(httpStatus.FORBIDDEN);
//     });

//     test('should return 204 if admin is trying to delete another user', async () => {
//       await insertUsers([userOne, admin]);

//       await request(app)
//         .delete(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send()
//         .expect(httpStatus.NO_CONTENT);
//     });

//     test('should return 400 error if userId is not a valid mongo id', async () => {
//       await insertUsers([admin]);

//       await request(app)
//         .delete('/v1/users/invalidId')
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send()
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 404 error if user already is not found', async () => {
//       await insertUsers([admin]);

//       await request(app)
//         .delete(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send()
//         .expect(httpStatus.NOT_FOUND);
//     });
//   });

//   describe('PATCH /v1/users/:userId', () => {
//     test('should return 200 and successfully update user if data is ok', async () => {
//       await insertUsers([userOne]);
//       const updateBody = {
//         name: faker.name.findName(),
//         email: faker.internet.email().toLowerCase(),
//         password: 'newPassword1',
//       };

//       const res = await request(app)
//         .patch(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.OK);

//       expect(res.body).not.toHaveProperty('password');
//       expect(res.body).toEqual({
//         id: userOne._id.toHexString(),
//         name: updateBody.name,
//         email: updateBody.email,
//         role: 'user',
//       });

//       const dbUser = await User.findById(userOne._id);
//       expect(dbUser).toBeDefined();
//       expect(dbUser.password).not.toBe(updateBody.password);
//       expect(dbUser).toMatchObject({ name: updateBody.name, email: updateBody.email, role: 'user' });
//     });

//     test('should return 401 error if access token is missing', async () => {
//       await insertUsers([userOne]);
//       const updateBody = { name: faker.name.findName() };

//       await request(app).patch(`/v1/users/${userOne._id}`).send(updateBody).expect(httpStatus.UNAUTHORIZED);
//     });

//     test('should return 403 if user is updating another user', async () => {
//       await insertUsers([userOne, userTwo]);
//       const updateBody = { name: faker.name.findName() };

//       await request(app)
//         .patch(`/v1/users/${userTwo._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.FORBIDDEN);
//     });

//     test('should return 200 and successfully update user if admin is updating another user', async () => {
//       await insertUsers([userOne, admin]);
//       const updateBody = { name: faker.name.findName() };

//       await request(app)
//         .patch(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.OK);
//     });

//     test('should return 404 if admin is updating another user that is not found', async () => {
//       await insertUsers([admin]);
//       const updateBody = { name: faker.name.findName() };

//       await request(app)
//         .patch(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.NOT_FOUND);
//     });

//     test('should return 400 error if userId is not a valid mongo id', async () => {
//       await insertUsers([admin]);
//       const updateBody = { name: faker.name.findName() };

//       await request(app)
//         .patch(`/v1/users/invalidId`)
//         .set('Authorization', `Bearer ${adminAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 400 if email is invalid', async () => {
//       await insertUsers([userOne]);
//       const updateBody = { email: 'invalidEmail' };

//       await request(app)
//         .patch(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 400 if email is already taken', async () => {
//       await insertUsers([userOne, userTwo]);
//       const updateBody = { email: userTwo.email };

//       await request(app)
//         .patch(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should not return 400 if email is my email', async () => {
//       await insertUsers([userOne]);
//       const updateBody = { email: userOne.email };

//       await request(app)
//         .patch(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.OK);
//     });

//     test('should return 400 if password length is less than 8 characters', async () => {
//       await insertUsers([userOne]);
//       const updateBody = { password: 'passwo1' };

//       await request(app)
//         .patch(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.BAD_REQUEST);
//     });

//     test('should return 400 if password does not contain both letters and numbers', async () => {
//       await insertUsers([userOne]);
//       const updateBody = { password: 'password' };

//       await request(app)
//         .patch(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.BAD_REQUEST);

//       updateBody.password = '11111111';

//       await request(app)
//         .patch(`/v1/users/${userOne._id}`)
//         .set('Authorization', `Bearer ${userOneAccessToken}`)
//         .send(updateBody)
//         .expect(httpStatus.BAD_REQUEST);
//     });
//   });
// });
