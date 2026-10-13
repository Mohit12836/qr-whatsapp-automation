import urllib.request
import json
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

ENCRYPTION_KEY = bytes.fromhex('fbf17d663fa59a3358bcdb1540938fbb634339a5bfab1c378d752dcff533175d')

url = 'https://pkgdlegabfwqmnjqterb.supabase.co/rest/v1/whatsapp_config?select=access_token,phone_number_id,waba_id'
headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrZ2RsZWdhYmZ3cW1uanF0ZXJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDUxNjI4NCwiZXhwIjoyMTA2MDkyMjg0fQ.7Mgn0Ay_asKpLWych9z-OkPzQdN322exz4PveS23Jt0',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrZ2RsZWdhYmZ3cW1uanF0ZXJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDUxNjI4NCwiZXhwIjoyMTA2MDkyMjg0fQ.7Mgn0Ay_asKpLWych9z-OkPzQdN322exz4PveS23Jt0'
}

req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as r:
    row = json.loads(r.read().decode('utf-8'))[0]

parts = row['access_token'].split(':')
iv = bytes.fromhex(parts[0])
ciphertext = bytes.fromhex(parts[1])
tag = bytes.fromhex(parts[2])
aesgcm = AESGCM(ENCRYPTION_KEY)
token = aesgcm.decrypt(iv, ciphertext + tag, None).decode('utf-8')
waba_id = row['waba_id']
phone_id = row['phone_number_id']

print("--- META WABA AUDIT ---")
print("WABA ID:", waba_id)
print("Phone ID:", phone_id)

tpl_url = f"https://graph.facebook.com/v21.0/{waba_id}/message_templates"
m_req = urllib.request.Request(tpl_url, headers={'Authorization': f'Bearer {token}'})
try:
    with urllib.request.urlopen(m_req) as resp:
        templates = json.loads(resp.read().decode('utf-8'))
        data = templates.get('data', [])
        print(f"Total Meta Templates: {len(data)}")
        for t in data:
            print(f"  * {t.get('name')} | Status: {t.get('status')} | Category: {t.get('category')} | Lang: {t.get('language')}")
except Exception as e:
    print("Error fetching templates:", e)
