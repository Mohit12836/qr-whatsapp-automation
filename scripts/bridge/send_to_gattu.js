const http = require('http');

async function sendRequest(path, payload) {
    return new Promise((resolve, reject) => {
        const data = Buffer.from(JSON.stringify(payload), 'utf-8');
        const req = http.request({
            hostname: '127.0.0.1',
            port: 3001,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Content-Length': data.length
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function main() {
    const phone = '9754023796';

    const msgInstructions = `गट्टू भाई, व्हाट्सएप पर 1 नया चैनल बना दो (सिर्फ 10 सेकंड लगेंगे):

1. अपने फोन में WhatsApp खोलना।
2. नीचे 'Updates' टैब पर जाना।
3. Channels के सामने '+' दबाकर 'Create channel' पर क्लिक करना।
4. चैनल का नाम: Business Growth & Market Insights 📈
5. डिस्क्रिप्शन: Daily Business Growth Strategies, Market Intelligence, Official Scheme Updates & Festive Sales Frameworks for Modern Entrepreneurs and Shopkeepers.
6. डीपी में भेजी गई फोटो (लोगो) लगाना।

⚠️ सबसे जरूरी काम:
चैनल बनने के बाद:
- चैनल की प्रोफाइल (Channel Info) में जाकर 'Invite Admins' पर क्लिक करना।
- मेरे नंबर (918989605297) को Admin बना देना।
- और चैनल का Invite Link मुझे यहाँ भेज देना।`;

    const msgName = `Business Growth & Market Insights 📈`;

    const msgDesc = `Daily Business Growth Strategies, Market Intelligence, Official Scheme Updates & Festive Sales Frameworks for Modern Entrepreneurs and Shopkeepers.`;

    console.log('[1/4] Sending instructions...');
    const r1 = await sendRequest('/send', { phone, message: msgInstructions });
    console.log('Result 1:', r1);

    await new Promise(r => setTimeout(r, 1200));

    console.log('[2/4] Sending channel name for easy copy...');
    const r2 = await sendRequest('/send', { phone, message: msgName });
    console.log('Result 2:', r2);

    await new Promise(r => setTimeout(r, 1200));

    console.log('[3/4] Sending channel description for easy copy...');
    const r3 = await sendRequest('/send', { phone, message: msgDesc });
    console.log('Result 3:', r3);

    await new Promise(r => setTimeout(r, 1200));

    console.log('[4/4] Sending logo image...');
    const r4 = await sendRequest('/session/default/send-media', {
        phone,
        mediaUrl: '/root/wa-bridge/channel_logo.jpg',
        caption: 'चैनल की प्रोफाइल फोटो (DP) में यह लोगो लगाना 📈'
    });
    console.log('Result 4:', r4);
}

main().catch(console.error);
