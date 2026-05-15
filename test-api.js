const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/assignments/my-tasks',
  method: 'GET',
}, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', body));
});
req.end();
