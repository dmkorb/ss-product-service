const request = require('supertest');
const httpStatus = require('http-status')
const app = require('../src/app');
const { Product, Store } = require('../src/models')
const { 
    getUser,
    getStaff,
    getManager,
    setupTestDB, 
    getUserToken,
    getStaffToken,
    getManagerToken
} = require('./setup');

setupTestDB();

let store = {
    _id: undefined,
    name: "Loja de produtos"
}

let product = {
    name: 'Single product',
    description: 'Descrição do produto',
    image_url: 'http://image_url/',
    price: 123
}

describe('Product routes', () => {
    beforeAll(async (done) => {
        let staff = await getStaff();
        let manager = await getManager();

        s = await Store.create(store);
        s.manager = manager._id;
        s.staff.push(staff._id)
        await s.save();

        store = s;

        done();
    })

    describe('GET /api/products', () => {
        test('should return 200 and no products', async () => {
            const res = await request(app)
                .get('/api/products')
                .expect(httpStatus.OK);

            expect(res.body).toHaveProperty('count');
            expect(res.body.count).toBe(0)

            expect(res.body).toHaveProperty('products')
            expect(res.body.products).toHaveLength(0)
        })
    })

    describe('POST /api/products', () => {
        test('should not create a product without store', async () => {
            let userToken = await getManagerToken();

            const res = await request(app)
                .post(`/api/products`)
                .set('Authorization', `Bearer ${userToken}`)
                .send(product)
                .expect(httpStatus.BAD_REQUEST)
        })

        test('should not create a product without permissions', async () => {
            let userToken = await getUserToken();

            const res = await request(app)
                .post(`/api/products`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ ...product, store_id: store._id })
                .expect(httpStatus.FORBIDDEN)
        })

        test('should create a product as manager', async () => {
            let userToken = await getManagerToken();

            const res = await request(app)
                .post(`/api/products`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ ...product, store_id: store._id })
                .expect(httpStatus.CREATED)

            expect(res.body).toMatchObject(product);
        })

        test('should create a product as staff', async () => {
            let userToken = await getStaffToken();

            const res = await request(app)
                .post(`/api/products`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ ...product, store_id: store._id })
                .expect(httpStatus.CREATED)

            expect(res.body).toMatchObject(product);
        })

        test('should not create a product when not manager/staff', async () => {
            let userToken = await getUserToken();

            const res = await request(app)
                .post(`/api/products`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ ...product, store_id: store._id })
                .expect(httpStatus.FORBIDDEN)
        })
    })

    describe('GET /api/products/:id', () => {
        test('should not find an invalid product', async () => {
            const res = await request(app)
                .get('/api/products/invalidproduct')
                .expect(httpStatus.NOT_FOUND)
        
            expect(res.body).toHaveProperty('message')
        })

        test('should find a product authorized', async () => {
            let userToken = await getManagerToken();
            let p = await Product.findOne();
            expect(p).toBeDefined();

            const res = await request(app)
                .get(`/api/products/${p._id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(httpStatus.OK)
            
            expect(res.body).toHaveProperty('created_at');
            expect(res.body).toHaveProperty('created_by');
        })

        test('should not show detailed information', async () => {
            let p = await Product.findOne();
            
            const res = await request(app)
                .get(`/api/products/${p._id}`)
                .expect(httpStatus.OK)
            
            expect(res.body).not.toHaveProperty('created_at');
            expect(res.body).not.toHaveProperty('created_by');
        })
    })

    describe('PUT /api/products/:id', () => {
        test('should not update a product when not authorized', async () => {
            let p = await Product.findOne();
            let userToken = await getUserToken();

            const res = await request(app)
                .put(`/api/products/${p._id}`)
                .send({ name: 'Updated name' })
                .set('Authorization', `Bearer ${userToken}`)
                .expect(httpStatus.FORBIDDEN)
        })

        test('should update a product as manager', async () => {
            let p = await Product.findOne();
            let userToken = await getManagerToken();
            let name = 'Updated by manager'
            
            const res = await request(app)
                .put(`/api/products/${p._id}`)
                .send({ name })
                .set('Authorization', `Bearer ${userToken}`)
                .expect(httpStatus.OK)

            expect(res.body).toMatchObject({ name })
        })

        test('should update a product as staff', async () => {
            let p = await Product.findOne();
            let userToken = await getStaffToken();
            let name = 'Updated by staff'
            
            const res = await request(app)
                .put(`/api/products/${p._id}`)
                .send({ name })
                .set('Authorization', `Bearer ${userToken}`)
                .expect(httpStatus.OK)

            expect(res.body).toMatchObject({ name })
        })
    })

    describe('DELETE /api/products/:id', () => {
        test('should not remove a product without auth', async () => {
            let p = await Product.findOne();

            const res = await request(app)
                .delete(`/api/products/${p._id}`)
                .expect(httpStatus.UNAUTHORIZED)
        })

        test('should not remove a product from another store', async () => {
            let p = await Product.findOne();
            let userToken = await getUserToken();

            const res = await request(app)
                .delete(`/api/products/${p._id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(httpStatus.FORBIDDEN)
        })

        test('should remove a product', async () => {
            let p = await Product.findOne();
            let userToken = await getManagerToken();

            const res = await request(app)
                .delete(`/api/products/${p._id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(httpStatus.OK)
        })
    })
})