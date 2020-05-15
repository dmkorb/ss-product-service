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

    describe('GET /api/stores', () => {
        test('should return 200 and no stores', async () => {
            const res = await request(app)
                .get('/api/stores')
                .expect(httpStatus.OK);
            
            expect(res.body).toHaveProperty('count');
            expect(res.body).toHaveProperty('stores')
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