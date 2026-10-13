import re

blade_path = "/var/www/vismart.cloud/html/resources/views/vendors/settings/whatsapp-cloud-api-setup.blade.php"
with open(blade_path, "r", encoding="utf-8") as f:
    blade_code = f.read()

# Pass current exact browser URL in payload
old_post = """                    __DataRequest.post(
                        '{{ route('vendor.whatsapp_setup.embedded_signup.write') }}',
                        {
                            request_code: tempAccessCode,
                            waba_id: globalWaBaId,
                            phone_number_id: globalPhoneNumberId
                        },"""

new_post = """                    const exactRedirectUri = window.location.origin + window.location.pathname;
                    __DataRequest.post(
                        '{{ route('vendor.whatsapp_setup.embedded_signup.write') }}',
                        {
                            request_code: tempAccessCode,
                            waba_id: globalWaBaId,
                            phone_number_id: globalPhoneNumberId,
                            redirect_uri: exactRedirectUri
                        },"""

if old_post in blade_code:
    blade_code = blade_code.replace(old_post, new_post, 1)
    with open(blade_path, "w", encoding="utf-8") as f:
        f.write(blade_code)
    print("SUCCESS_PATCHED_BLADE_URI")
else:
    print("BLADE_TARGET_NOT_FOUND")

# Now patch backend WhatsAppConnectApiService.php to prioritize request->redirect_uri
service_path = "/var/www/vismart.cloud/html/app/Yantrana/Components/WhatsAppService/Services/WhatsAppConnectApiService.php"
with open(service_path, "r", encoding="utf-8") as f:
    service_code = f.read()

# Look for token exchange payload
target_marker = "$metaConfiguredRedirectUri = 'https://vismart.cloud';"
if target_marker in service_code:
    # We update it to strictly use request->redirect_uri first
    pattern = r'\$metaConfiguredRedirectUri = \'https://vismart\.cloud\';[\s\S]*?\$tokenData = \$this->apiPostRequest\("{\$this->baseApiRequestEndpoint}oauth/access_token", \$tokenPayload\);[\s\S]*?if \(empty\(\$tokenData\[\'access_token\'\]\) && isset\(\$tokenData\[\'error\'\]\)\) \{[\s\S]*?\}\s*\}'
    
    new_service_block = """$chosenRedirectUri = $request->redirect_uri ?: (url()->current() ?: 'https://vismart.cloud');
            $tokenPayload = [
                'client_id' => getAppSettings('embedded_signup_app_id'),
                'client_secret' => getAppSettings('embedded_signup_app_secret'),
                'code' => $request->request_code,
                'redirect_uri' => $chosenRedirectUri,
            ];
            $tokenData = $this->apiPostRequest("{$this->baseApiRequestEndpoint}oauth/access_token", $tokenPayload);

            // If error, auto-try with exact origin without path, or empty string
            if (empty($tokenData['access_token']) && isset($tokenData['error'])) {
                $tokenPayload['redirect_uri'] = 'https://vismart.cloud';
                $retry1 = $this->apiPostRequest("{$this->baseApiRequestEndpoint}oauth/access_token", $tokenPayload);
                if (!empty($retry1['access_token'])) {
                    $tokenData = $retry1;
                } else {
                    $tokenPayload['redirect_uri'] = '';
                    $retry2 = $this->apiPostRequest("{$this->baseApiRequestEndpoint}oauth/access_token", $tokenPayload);
                    if (!empty($retry2['access_token'])) {
                        $tokenData = $retry2;
                    } else {
                        unset($tokenPayload['redirect_uri']);
                        $retry3 = $this->apiPostRequest("{$this->baseApiRequestEndpoint}oauth/access_token", $tokenPayload);
                        if (!empty($retry3['access_token'])) {
                            $tokenData = $retry3;
                        }
                    }
                }
            }"""
    service_code = re.sub(pattern, new_service_block, service_code, count=1)
    with open(service_path, "w", encoding="utf-8") as f:
        f.write(service_code)
    print("SUCCESS_PATCHED_SERVICE_DYNAMIC_URI")
else:
    print("SERVICE_MARKER_NOT_FOUND")
