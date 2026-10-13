file_path = "/var/www/vismart.cloud/html/resources/views/vendors/settings/whatsapp-cloud-api-setup.blade.php"

with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

# Make sure that on error or completion, isSetupInProcess is reset and the exact error is alerted so the user never gets stuck for 5 minutes!
target_post = """                    const exactRedirectUri = window.location.origin + window.location.pathname;
                    __DataRequest.post(
                        '{{ route('vendor.whatsapp_setup.embedded_signup.write') }}',
                        {
                            request_code: tempAccessCode,
                            waba_id: globalWaBaId,
                            phone_number_id: globalPhoneNumberId,
                            redirect_uri: exactRedirectUri
                        },
                        function () {
                            __DataRequest.updateModels({ isSetupInProcess: false });
                        },
                        { eventStreamUpdate: true }
                    );"""

replacement_post = """                    __DataRequest.post(
                        '{{ route('vendor.whatsapp_setup.embedded_signup.write') }}',
                        {
                            request_code: tempAccessCode,
                            waba_id: globalWaBaId,
                            phone_number_id: globalPhoneNumberId
                        },
                        function (response) {
                            __DataRequest.updateModels({ isSetupInProcess: false });
                            if (response && response.data && response.data.message) {
                                alert(response.data.message);
                            }
                        },
                        { 
                            eventStreamUpdate: true,
                            onError: function(err) {
                                __DataRequest.updateModels({ isSetupInProcess: false });
                                alert('Error: ' + (err?.data?.message || err?.statusText || 'Setup failed'));
                            }
                        }
                    );"""

if target_post in text:
    text = text.replace(target_post, replacement_post, 1)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(text)
    print("SUCCESS_STOP_STICKY_LOADER")
else:
    print("TARGET_POST_NOT_FOUND")
