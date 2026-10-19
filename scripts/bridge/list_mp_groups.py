import urllib.request
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

try:
    req = urllib.request.urlopen('http://72.61.232.114:3001/groups', timeout=15)
    data = json.loads(req.read().decode('utf-8'))
    groups = data.get('groups', [])
    
    csc_grps = []
    for g in groups:
        text = (g.get('subject', '') + ' ' + g.get('desc', '')).lower()
        if any(k in text for k in ['csc', 'mponline', 'mp online', 'rto', 'exam', 'parivahan', 'aayushman', 'sarkari', 'vle', 'kiosk', 'samgra', 'form', 'krupa', 'anu']):
            csc_grps.append(g)
            
    print(f"Total MP Online / CSC Related Groups: {len(csc_grps)}")
    for i, g in enumerate(csc_grps[:20], 1):
        subj = g.get('subject', 'Unnamed')
        count = g.get('participantsCount', 0)
        gid = g.get('id', '')
        print(f"{i}. {subj} | Members: {count} | ID: {gid}")
except Exception as e:
    print(f"Error: {e}")
