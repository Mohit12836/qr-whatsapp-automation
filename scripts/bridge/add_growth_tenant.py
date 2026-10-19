import json

path = 'data/autopilot_tenants.json'
with open(path, 'r', encoding='utf-8') as f:
    tenants = json.load(f)

# Check if tenant_business_growth already exists
existing = [t for t in tenants if t.get('id') == 'tenant_business_growth']
if not existing:
    new_tenant = {
        "id": "tenant_business_growth",
        "ownerName": "Gattu & Admin",
        "businessName": "Business Growth & Market Insights 📈",
        "phone": "918989605297",
        "niche": "general_business",
        "channelJid": "120363432174967045@newsletter",
        "targetGroupJids": [],
        "brandVoice": "Actionable, viral, high-value retail growth strategies and market insights for business owners without pushy spam.",
        "dailySchedule": {
            "morningPostTime": "09:00",
            "eveningHookTime": "19:00",
            "isAutoPilotActive": True
        },
        "customPillars": [
            {
                "id": "p_growth_1",
                "pillar": "educational_value",
                "topic": "दिवाली सेल्स सीक्रेट्स",
                "headline": "🚀 *व्यापारियों और दुकानदारों के लिए 3 'दिवाली सेल्स सीक्रेट्स' जो बिक्री 2x कर देंगे! 🪔*",
                "body": "1. उधारी रोकने का नियम: त्योहार पर 50% टोकन जरूर लें।\n2. कॉम्बो ऑफर्स: दो सामान मिलाकर बंडल ऑफर दें।\n3. वीआईपी विशेज: पर्सनलाइज्ड ग्रीटिंग भेजें।",
                "callToAction": "📈 इस पोस्ट को अपने व्यापारी मित्रों के साथ जरूर शेयर करें!"
            }
        ],
        "stats": {
            "totalPostsPublished": 1,
            "inboundLeadsGenerated": 0,
            "dealsClosed": 0,
            "lastPublishedAt": "2026-10-19T17:15:29.000Z"
        },
        "createdAt": "2026-10-19T17:15:00.000Z",
        "updatedAt": "2026-10-19T17:15:29.000Z"
    }
    tenants.append(new_tenant)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(tenants, f, indent=2, ensure_ascii=False)
    print("ADDED_TENANT_BUSINESS_GROWTH")
else:
    print("ALREADY_EXISTS")
