import os

server_js_path = "/root/wa-bridge/server.js"

with open(server_js_path, "r", encoding="utf-8") as f:
    content = f.read()

channel_list_endpoint = """
// List subscribed / owned WhatsApp Channels (Newsletters)
app.get('/channel/list', async (req, res) => {
    let targetSession = sessions.get('default');
    if (!targetSession || !targetSession.connected) {
        for (const [id, s] of sessions.entries()) {
            if (s.connected) { targetSession = s; break; }
        }
    }
    if (!targetSession || !targetSession.connected) {
        return res.status(503).json({ error: 'WhatsApp is not connected' });
    }
    try {
        const result = await targetSession.sock.query({
            tag: 'iq',
            attrs: {
                to: 's.whatsapp.net',
                type: 'get',
                xmlns: 'newsletter'
            },
            content: [{ tag: 'subscribed', attrs: {} }]
        });
        console.log('[+] Subscribed channels:', JSON.stringify(result));
        res.json({ success: true, result });
    } catch(err) {
        console.error('[!] Error fetching channels:', err);
        res.status(500).json({ error: err.message });
    }
});
"""

if "/channel/list" not in content:
    target = "app.get('/status'"
    content = content.replace(target, channel_list_endpoint + "\n" + target)
    with open(server_js_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("PATCHED_CHANNEL_LIST")
else:
    print("ALREADY_PATCHED")
