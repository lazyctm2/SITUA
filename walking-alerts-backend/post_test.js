const https = require('https');
const data = JSON.stringify({ alertTypeId: 1, lat: -38.7359, lng: -72.5904, deviceId: 'web' });
const options = {
  hostname: '10.40.63.9',
  port: 3000,
  path: '/alerts',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
  rejectUnauthorized: false,
};
const req = https.request(options, res => {
  console.log('statusCode', res.statusCode);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(body));
});
req.on('error', error => console.error(error));
req.write(data);
req.end();
