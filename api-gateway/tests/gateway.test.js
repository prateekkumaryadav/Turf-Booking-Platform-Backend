const request = require('supertest');
const app = require('../gateway');

describe('API Gateway', () => {
  it('should return 200 on health check route /', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Turf Booking API Gateway is running');
  });
});
