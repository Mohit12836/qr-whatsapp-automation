import os

server_js_path = "/root/wa-bridge/server.js"

with open(server_js_path, "r", encoding="utf-8") as f:
    content = f.read()

resolve_endpoint = """
// Resolve channel from public link or invite code
app.post('/channel/resolve', async (req, res) => {
    let { link, inviteCode } = req.body;
    if (link && link.includes('whatsapp.com/channel/')) {
        inviteCode = link.split('whatsapp.com/channel/')[1].split('?')[0].split('/')[0];
    }
    if (!inviteCode) {
        return res.status(400).json({ error: 'Invite code or channel link required' });
    }
    let targetSession = sessions.get('default');
    if (!targetSession || !targetSession.connected) {
        return res.status(503).json({ error: 'WhatsApp not connected' });
    }
    try {
        const metadata = await targetSession.sock.newsletterMetadata("INVITE", inviteCode);
        console.log('[+] Resolved channel metadata:', metadata);
        res.json({ success: true, metadata });
    } catch(err) {
        console.error('[!] Error resolving channel:', err);
        res.status(500).json({ error: err.message });
    }
});
"""

if "/channel/resolve" not in content:
    target = "app.get('/status'"
    content = content.replace(target, resolve_endpoint + "\n" + target)
    with open(server_js_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("PATCHED_RESOLVE")
else:
    print("ALREADY_PATCHED")
