import os

server_js_path = "/root/wa-bridge/server.js"

with open(server_js_path, "r", encoding="utf-8") as f:
    content = f.read()

channel_endpoints = """
// Create a new WhatsApp Channel (Newsletter)
app.post('/channel/create', async (req, res) => {
    const { name, description } = req.body;
    let targetSession = sessions.get('default');
    if (!targetSession || !targetSession.connected) {
        for (const [id, s] of sessions.entries()) {
            if (s.connected) { targetSession = s; break; }
        }
    }
    if (!targetSession || !targetSession.connected) {
        return res.status(503).json({ error: 'WhatsApp is not connected' });
    }
    if (!name) {
        return res.status(400).json({ error: 'Channel name is required' });
    }
    try {
        const metadata = await targetSession.sock.newsletterCreate(name, description || '');
        console.log('[+] Created WhatsApp Channel:', metadata);
        res.json({ success: true, channel: metadata });
    } catch(err) {
        console.error('[!] Error creating channel:', err);
        res.status(500).json({ error: err.message });
    }
});

// Send post to a WhatsApp Channel (Newsletter)
app.post('/channel/send', async (req, res) => {
    const { channelJid, message } = req.body;
    let targetSession = sessions.get('default');
    if (!targetSession || !targetSession.connected) {
        for (const [id, s] of sessions.entries()) {
            if (s.connected) { targetSession = s; break; }
        }
    }
    if (!targetSession || !targetSession.connected) {
        return res.status(503).json({ error: 'WhatsApp is not connected' });
    }
    if (!channelJid || !message) {
        return res.status(400).json({ error: 'channelJid and message are required' });
    }
    try {
        const result = await targetSession.sock.sendMessage(channelJid, { text: message });
        console.log(`[+] Published post to channel ${channelJid}`);
        res.json({ success: true, to: channelJid, messageId: result && result.key ? result.key.id : null });
    } catch(err) {
        console.error('[!] Error sending to channel:', err);
        res.status(500).json({ error: err.message });
    }
});
"""

if "/channel/create" not in content:
    target = "app.get('/status'"
    if target in content:
        content = content.replace(target, channel_endpoints + "\n" + target)
        with open(server_js_path, "w", encoding="utf-8") as f:
            f.write(content)
        print("PATCHED_SUCCESSFULLY")
    else:
        print("TARGET_NOT_FOUND")
else:
    print("ALREADY_PATCHED")
