import json

with open("/root/wa-bridge/saved_groups.json", "r", encoding="utf-8") as f:
    data = json.load(f)

groups = data.get("groups", [])

categories = {
    "1. MP Online / CSC VLEs / Cyber Cafes": [],
    "2. MSME Business Owners / BNI / Founders": [],
    "3. Real Estate Brokers & Property Dealers": [],
    "4. Textile, Garments & Wholesale Traders": [],
    "5. Tech, Solar, CCTV & Electronics": [],
    "6. Religious, Community & Local Help Services (Indore/Jaora/MP)": []
}

for g in groups:
    s = (g.get("subject", "") + " " + g.get("desc", "")).lower()
    p = g.get("participantsCount", 0)
    name = g.get("subject", "Unnamed")
    
    if any(k in s for k in ["csc", "mponline", "mp online", "rto", "exam", "parivahan", "aayushman", "sarkari", "vle", "kiosk", "samgra"]):
        categories["1. MP Online / CSC VLEs / Cyber Cafes"].append((name, p))
    elif any(k in s for k in ["business owner", "founder", "bni", "ceo", "entrepreneur", "bharat business", "all india business", "distributor"]):
        categories["2. MSME Business Owners / BNI / Founders"].append((name, p))
    elif any(k in s for k in ["real estate", "property", "broker", "office space", "plot", "land", "housing"]):
        categories["3. Real Estate Brokers & Property Dealers"].append((name, p))
    elif any(k in s for k in ["textile", "fabric", "clothes", "garment", "cotton", "suit", "saree", "handloom", "hathkargha"]):
        categories["4. Textile, Garments & Wholesale Traders"].append((name, p))
    elif any(k in s for k in ["solar", "marketing", "led", "electronics", "cctv", "digital", "ai tools", "computer"]):
        categories["5. Tech, Solar, CCTV & Electronics"].append((name, p))
    else:
        categories["6. Religious, Community & Local Help Services (Indore/Jaora/MP)"].append((name, p))

print("=== CATEGORY BREAKDOWN ===")
for cat, grp_list in categories.items():
    total_m = sum(p for _, p in grp_list)
    top_samples = [f"{n} ({p})" for n, p in sorted(grp_list, key=lambda x: x[1], reverse=True)[:4]]
    print(f"\n{cat.upper()}")
    print(f"- Total Groups: {len(grp_list)} | Estimated Reach: {total_m:,} people")
    print(f"- Top Groups: {', '.join(top_samples)}")
