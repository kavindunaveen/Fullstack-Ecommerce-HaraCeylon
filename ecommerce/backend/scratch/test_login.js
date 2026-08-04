const https = require('https');

const data = JSON.stringify({
  email: 'admin@haraceylon.com',
  password: 'HaraAdmin123!'
});

const options = {
  hostname: 'api.haraceylon.com',
  port: 443,
  path: '/api/admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseBody = '';
  res.on('data', (chunk) => responseBody += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', responseBody);
  });
});

req.on('error', (e) => {
  console.error(e);
});

req.write(data);
req.end();
