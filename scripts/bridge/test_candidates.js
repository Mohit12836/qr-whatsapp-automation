const http = require('http');

async function testCodes() {
    const rawCode = "0029VaereKLFHWq6cbeIwA2ae";
    const candidates = [
        rawCode,
        rawCode.slice(0, 24),
        rawCode.slice(0, 23),
        rawCode.slice(0, 22),
    ];

    for (const code of candidates) {
        console.log(`Testing candidate: ${code} (len: ${code.length})`);
        const payload = JSON.stringify({ inviteCode: code });
        
        try {
            const res = await new Promise((resolve, reject) => {
                const req = http.request({
                    hostname: '127.0.0.1',
                    port: 3001,
                    path: '/channel/resolve',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(payload)
                    }
                }, (r) => {
                    let d = '';
                    r.on('data', chunk => d += chunk);
                    r.on('end', () => resolve({ status: r.statusCode, body: d }));
                });
                req.on('error', reject);
                req.write(payload);
                req.end();
            });
            console.log(`Status: ${res.status}, Body: ${res.body}`);
            if (res.status === 200) {
                console.log(`===> SUCCESS WITH: ${code}`);
                break;
            }
        } catch(e) {
            console.error("Req error:", e.message);
        }
    }
}

testCodes();
