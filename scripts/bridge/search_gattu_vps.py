import json
import os
import re

print("Searching saved_groups.json...")
try:
    with open('/root/wa-bridge/saved_groups.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    groups = data.get('groups', [])
    for g in groups:
        subject = g.get('subject', '')
        desc = g.get('desc', '')
        full = f"{subject} {desc}".lower()
        if 'gattu' in full or 'गट्टू' in full:
            print(f"Found in group: {subject} (ID: {g.get('id')})")
            
        participants = g.get('participants', [])
        for p in participants:
            # check notify name if any
            name = str(p)
            if 'gattu' in name.lower() or 'गट्टू' in name.lower():
                print(f"Found participant: {p} in {subject}")
except Exception as e:
    print(f"Error reading groups: {e}")

# Check any other files in wa-bridge
print("\nSearching other files...")
for root, dirs, files in os.walk('/root/wa-bridge/sessions'):
    for f in files:
        if f.endswith('.json'):
            fp = os.path.join(root, f)
            try:
                content = open(fp, 'r', encoding='utf-8', errors='ignore').read()
                if 'gattu' in content.lower() or 'गट्टू' in content:
                    print(f"Found in {fp}")
            except:
                pass
