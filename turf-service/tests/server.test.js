const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('Turf Service Basic Endpoints', () => {
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should return 200 on health check route /', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Turf Service is running');
  });
});
