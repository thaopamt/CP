const jwt = require('jsonwebtoken');
const http = require('http');

const token = jwt.sign({
  sub: 'fd0e0a88-0ead-42ad-8655-5879ab4f0b24', // fake user id
  email: 'admin@admin.com',
  role: 'ADMIN',
}, 'dev-only-change-me', { expiresIn: '1d' });

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/assignments/my-tasks',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
}, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', body));
});
req.end();
