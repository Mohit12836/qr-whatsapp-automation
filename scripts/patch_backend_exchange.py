import sys

file_path = "/var/www/vismart.cloud/html/app/Yantrana/Components/WhatsAppService/Services/WhatsAppConnectApiService.php"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_block = """            $tokenData = $this->apiPostRequest("{$this->baseApiRequestEndpoint}oauth/access_token", [
                'client_id' => getAppSettings('embedded_signup_app_id'),
                'client_secret' => getAppSettings('embedded_signup_app_secret'),
                'redirect_uri' => '',
                'code' => $request->request_code,
            ]);"""

new_block = """            // Try direct code exchange. If redirect_uri is passed or enforced, support both
            $tokenPayload = [
                'client_id' => getAppSettings('embedded_signup_app_id'),
                'client_secret' => getAppSettings('embedded_signup_app_secret'),
                'code' => $request->request_code,
            ];
            if ($request->filled('redirect_uri')) {
                $tokenPayload['redirect_uri'] = $request->redirect_uri;
            } else {
                $tokenPayload['redirect_uri'] = '';
            }
            $tokenData = $this->apiPostRequest("{$this->baseApiRequestEndpoint}oauth/access_token", $tokenPayload);
            // If failed with redirect_uri '', retry with origin URL or without redirect_uri
            if (empty($tokenData['access_token']) && isset($tokenData['error'])) {
                unset($tokenPayload['redirect_uri']);
                $retryTokenData = $this->apiPostRequest("{$this->baseApiRequestEndpoint}oauth/access_token", $tokenPayload);
                if (!empty($retryTokenData['access_token'])) {
                    $tokenData = $retryTokenData;
                } else {
                    $tokenPayload['redirect_uri'] = url()->current();
                    $retryTokenData2 = $this->apiPostRequest("{$this->baseApiRequestEndpoint}oauth/access_token", $tokenPayload);
                    if (!empty($retryTokenData2['access_token'])) {
                        $tokenData = $retryTokenData2;
                    }
                }
            }"""

if old_block in content:
    content = content.replace(old_block, new_block, 1)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("SUCCESS_PATCHED_EXCHANGE_RETRY")
else:
    print("TARGET_NOT_FOUND")
