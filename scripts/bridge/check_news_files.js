const fs = require('fs');

async function check() {
    // Check if session has store or chats
    const sessionDir = '/root/wa-bridge/sessions/default';
    if (!fs.existsSync(sessionDir)) {
        console.log("Session dir does not exist");
        return;
    }
    const files = fs.readdirSync(sessionDir);
    console.log("Total session files:", files.length);

    // Look for any newsletter files
    const newsletterFiles = files.filter(f => f.includes('newsletter'));
    console.log("Newsletter related files:", newsletterFiles);
}

check();
