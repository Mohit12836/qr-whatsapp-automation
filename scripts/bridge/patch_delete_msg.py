import os

server_js_path = "/root/wa-bridge/server.js"

with open(server_js_path, "r", encoding="utf-8") as f:
    content = f.read()

delete_endpoint = """
// Delete a message in a WhatsApp Channel or Chat
app.post('/channel/delete-message', async (req, res) => {
    const { channelJid, messageId } = req.body;
    let targetSession = sessions.get('default');
    if (!targetSession || !targetSession.connected) {
        for (const [id, s] of sessions.entries()) {
            if (s.connected) { targetSession = s; break; }
        }
    }
    if (!targetSession || !targetSession.connected) {
        return res.status(503).json({ error: 'WhatsApp is not connected' });
    }
    if (!channelJid || !messageId) {
        return res.status(400).json({ error: 'channelJid and messageId required' });
    }
    try {
        const key = {
            remoteJid: channelJid,
            fromMe: true,
            id: messageId
        };
        const result = await targetSession.sock.sendMessage(channelJid, { delete: key });
        console.log(`[+] Deleted message ${messageId} from ${channelJid}`);
        res.json({ success: true, deleted: messageId });
    } catch(err) {
        console.error('[!] Error deleting message:', err);
        res.status(500).json({ error: err.message });
    }
});
"""

if "/channel/delete-message" not in content:
    target = "app.get('/status'"
    content = content.replace(target, delete_endpoint + "\n" + target)
    with open(server_js_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("PATCHED_DELETE_MESSAGE")
else:
    print("ALREADY_PATCHED")
