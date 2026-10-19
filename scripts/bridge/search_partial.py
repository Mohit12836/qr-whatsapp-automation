import json

with open('/root/wa-bridge/saved_groups.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

for g in d.get('groups', []):
    s = g.get('subject', '').lower()
    desc = g.get('desc', '').lower()
    if any(k in s or k in desc for k in ['gat', 'gautam', 'goutam']):
        print(f"Group: {g.get('subject')}")
