import sys

file_path = "/var/www/vismart.cloud/html/app/Yantrana/Components/WhatsAppService/Services/WhatsAppConnectApiService.php"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

target = "'client_secret' => getAppSettings('embedded_signup_app_secret'),"
replacement = "'client_secret' => getAppSettings('embedded_signup_app_secret'),\n                'redirect_uri' => '',"

if target in content and "'redirect_uri' => ''" not in content:
    content = content.replace(target, replacement, 1)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("SUCCESS_PATCHED_REDIRECT_URI")
else:
    print("ALREADY_PATCHED_OR_NOT_FOUND")
