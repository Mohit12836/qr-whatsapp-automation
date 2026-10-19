import urllib.request
import json

channel_jid = "120363432174967045@newsletter"

post_text = """🚀 *व्यापारियों और दुकानदारों के लिए 3 'दिवाली सेल्स सीक्रेट्स' जो बिक्री 2x कर देंगे! 🪔*

दिवाली का सीज़न आ चुका है, लेकिन 80% दुकानदार वही पुरानी गलतियाँ करते हैं। अगर आप इस दिवाली रिकॉर्ड बिक्री करना चाहते हैं, तो इन 3 नियमों को अपनाएं:

1️⃣ *उधारी रोकने का आसान नियम:*
त्योहार पर माल देने से पहले 50% टोकन जरूर लें। जो ग्राहक त्योहार पर उधारी ले जाता है, वह बाद में 3 महीने चक्कर कटवाता है।

2️⃣ *कॉम्बो ऑफर्स का जादू:*
एक सामान पर डिस्काउंट देने के बजाय 2 सामान जोड़कर 'दिवाली स्पेशल कॉम्बो' बनाएं। ग्राहक को बचत दिखती है और आपका पुराना स्टॉक भी निकल जाता है।

3️⃣ *कस्टमर को 'VIP विशेज' भेजें:*
सामान्य 'Happy Diwali' का फोटो मत भेजिए। ग्राहक को निजी नाम से 2-लाइन की शुभकामना और स्पेशल इनविटेशन भेजिए।

💡 *आज का बिज़नेस मंत्र:*
"व्यापार में लाभ सिर्फ ज्यादा बेचने से नहीं, बल्कि सही समय पर सही फैसले लेने से आता है।"

━━━━━━━━━━━━━━━━━━
📈 *Business Growth & Market Insights*
(इस पोस्ट को अपने व्यापारी मित्रों के साथ जरूर शेयर करें!)"""

payload = json.dumps({
    "channelJid": channel_jid,
    "message": post_text
}, ensure_ascii=False).encode('utf-8')

req = urllib.request.Request(
    "http://72.61.232.114:3001/channel/send",
    data=payload,
    headers={"Content-Type": "application/json; charset=utf-8"},
    method="POST"
)

try:
    res = urllib.request.urlopen(req, timeout=15)
    print("SUCCESS:", res.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP_ERROR:", e.code, e.read().decode('utf-8'))
except Exception as e:
    print("ERROR:", e)
