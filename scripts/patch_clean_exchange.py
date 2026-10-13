file_path = "/var/www/vismart.cloud/html/app/Yantrana/Components/WhatsAppService/Services/WhatsAppConnectApiService.php"

with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

# Marker before token generation
start_marker = "if(!$accessToken) {"
end_marker = "if(!$phoneNumberId) {"

start_pos = text.find(start_marker)
end_pos = text.find(end_marker)

print(f"Start: {start_pos}, End: {end_pos}")

clean_token_block = """if(!$accessToken) {
            updateProgressTextModel(
                __tr('generating token ...')
            );

            // Single controlled token exchange request with clean redirect_uri => ''
            $tokenPayload = [
                'client_id' => getAppSettings('embedded_signup_app_id'),
                'client_secret' => getAppSettings('embedded_signup_app_secret'),
                'code' => $request->request_code,
                'redirect_uri' => '',
            ];

            // Metadata log as recommended
            \\Log::info('[OAUTH_TOKEN_EXCHANGE_PAYLOAD_METADATA]', [
                'app_id_configured' => getAppSettings('embedded_signup_app_id'),
                'redirect_uri_present' => array_key_exists('redirect_uri', $tokenPayload),
                'redirect_uri_value' => $tokenPayload['redirect_uri'] ?? null,
                'code_present' => !empty($tokenPayload['code']),
            ]);

            try {
                $rawResponse = Http::asForm()->post("{$this->baseApiRequestEndpoint}oauth/access_token", $tokenPayload);
                $tokenData = $rawResponse->json();
            } catch (\\Exception $e) {
                \\Log::error('[OAUTH_TOKEN_EXCHANGE_HTTP_EXCEPTION]: ' . $e->getMessage());
                abort(402, $e->getMessage());
            }

            if (empty($tokenData['access_token'])) {
                // Log exact Meta error response (code, error_subcode, fbtrace_id)
                \\Log::error('[META_OAUTH_EXACT_ERROR_RESPONSE]', [
                    'status' => $rawResponse->status(),
                    'error' => $tokenData['error'] ?? $tokenData,
                ]);

                $errMessage = Arr::get($tokenData, 'error.message', 'Failed to get Access token');
                $errSubcode = Arr::get($tokenData, 'error.error_subcode', 'NONE');
                $fbTraceId = Arr::get($tokenData, 'error.fbtrace_id', 'NONE');
                abort(402, "Meta OAuth Error: {$errMessage} [Subcode: {$errSubcode}, Trace: {$fbTraceId}]");
            }

            $this->accessToken = $tokenData['access_token'];
        } else {
            $this->accessToken = $accessToken;
        }
        """

new_text = text[:start_pos] + clean_token_block + text[end_pos:]

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_text)

print("SUCCESS_CLEAN_TOKEN_BLOCK_APPLIED")
