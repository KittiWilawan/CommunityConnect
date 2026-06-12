const http = require('http');

const header = Buffer.from(JSON.stringify({alg: "HS256", typ: "JWT"})).toString("base64url");
const payload = Buffer.from(JSON.stringify({
  sub: "U1234567890abcdef",
  name: "Test User",
  picture: "https://example.com/pic.jpg",
  email: "test@line.mock.local"
})).toString("base64url");
const token = `${header}.${payload}.dummysignature`;

const postData = JSON.stringify({ idToken: token });

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/auth/liff',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
