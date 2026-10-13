file_path = "/var/www/vismart.cloud/html/app/Yantrana/Components/WhatsAppService/Services/WhatsAppConnectApiService.php"

with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

# Replace 'redirect_uri' => '' with the exact redirect_uri passed from frontend or default exact route
target = "'redirect_uri' => '',"
replacement = "'redirect_uri' => $request->redirect_uri ?: 'https://vismart.cloud/vendor-console/settings/whatsapp-cloud-api-setup',"

if target in text:
    text = text.replace(target, replacement, 1)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(text)
    print("SUCCESS_REPLACED_EXACT_URI_IN_PAYLOAD")
else:
    print("TARGET_NOT_FOUND")
