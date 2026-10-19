const http = require('http');

// Let's query the bridge or test if 918989605297 is admin in Anu Krupa Online
const data = JSON.stringify({
    groupId: "120363028449917271@g.us",
    message: "🧪 Testing Anu Krupa Online group automation connectivity"
});

const req = http.request({
    hostname: '72.61.232.114',
    port: 3001,
    path: '/group/send',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
}, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
