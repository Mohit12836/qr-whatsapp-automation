import json

with open("/root/wa-bridge/saved_groups.json", "r", encoding="utf-8") as f:
    data = json.load(f)

matches = []
for g in data.get("groups", []):
    subject = g.get("subject", "")
    desc = g.get("desc", "")
    full_text = f"{subject} {desc}".lower()
    if "krupa" in full_text or "anu" in full_text:
        matches.append({
            "id": g.get("id"),
            "subject": subject,
            "participantsCount": g.get("participantsCount"),
            "owner": g.get("owner"),
            "desc": desc
        })

print(f"Total Matches Found: {len(matches)}")
print(json.dumps(matches, indent=2, ensure_ascii=False))
