const fs = require('fs');

async function inspectGroups() {
    // Check saved_groups.json
    const raw = fs.readFileSync('/root/wa-bridge/saved_groups.json', 'utf-8');
    const data = JSON.parse(raw);
    
    const targetGroups = data.groups.filter(g => 
        (g.subject && g.subject.toLowerCase().includes('anu krupa')) ||
        (g.desc && g.desc.toLowerCase().includes('anu krupa'))
    );

    console.log("Found", targetGroups.length, "groups matching 'Anu Krupa':");
    targetGroups.forEach(g => {
        console.log(`- ID: ${g.id}`);
        console.log(`  Subject: ${g.subject}`);
        console.log(`  Participants: ${g.participantsCount}`);
        console.log(`  Owner: ${g.owner}`);
        console.log(`  Announce (Only Admin Can Post): ${g.announce}`);
        console.log(`  Restrict (Only Admin Can Edit Info): ${g.restrict}`);
        console.log('---');
    });
}

inspectGroups();
