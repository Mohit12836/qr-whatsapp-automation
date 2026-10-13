import sys

file_path = "/var/www/vismart.cloud/html/app/Yantrana/Components/WhatsAppService/Services/WhatsAppConnectApiService.php"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Let's inspect what is currently around oauth/access_token
old_marker = "$tokenData = $this->apiPostRequest(\"{$this->baseApiRequestEndpoint}oauth/access_token\","

# We will replace the tokenData block to send https://vismart.cloud as redirect_uri and retry variants
replacement = """            // Byte-for-byte identical redirect_uri matching Meta Embedded Signup Configuration
            $metaConfiguredRedirectUri = 'https://vismart.cloud';
            $tokenPayload = [
                'client_id' => getAppSettings('embedded_signup_app_id'),
                'client_secret' => getAppSettings('embedded_signup_app_secret'),
                'code' => $request->request_code,
                'redirect_uri' => $metaConfiguredRedirectUri,
            ];
            $tokenData = $this->apiPostRequest("{$this->baseApiRequestEndpoint}oauth/access_token", $tokenPayload);

            // If error with https://vismart.cloud, retry with empty redirect_uri or without redirect_uri
            if (empty($tokenData['access_token']) && isset($tokenData['error'])) {
                $tokenPayload['redirect_uri'] = '';
                $retry1 = $this->apiPostRequest("{$this->baseApiRequestEndpoint}oauth/access_token", $tokenPayload);
                if (!empty($retry1['access_token'])) {
                    $tokenData = $retry1;
                } else {
                    unset($tokenPayload['redirect_uri']);
                    $retry2 = $this->apiPostRequest("{$this->baseApiRequestEndpoint}oauth/access_token", $tokenPayload);
                    if (!empty($retry2['access_token'])) {
                        $tokenData = $retry2;
                    }
                }
            }"""

import re
pattern = r'\$tokenPayload = \[[\s\S]*?\$tokenData = \$this->apiPostRequest\("{\$this->baseApiRequestEndpoint}oauth/access_token", \$tokenPayload\);[\s\S]*?if \(empty\(\$tokenData\[\'access_token\'\]\) && isset\(\$tokenData\[\'error\'\]\)\) \{[\s\S]*?\}\s*\}'

if re.search(pattern, content):
    content = re.sub(pattern, replacement, content, count=1)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("SUCCESS_PATCHED_EXACT_URI")
else:
    print("PATTERN_NOT_MATCHED")
