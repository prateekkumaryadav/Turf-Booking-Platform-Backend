const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
app.use('/api/auth', createProxyMiddleware({
  target: 'http://localhost:5001',
  changeOrigin: true,
}));

app.listen(5005, () => console.log('Test proxy on 5005'));
