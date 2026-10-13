with open("/var/www/vismart.cloud/html/.env", "r") as f:
    text = f.read()

text = text.replace("http://vismart.cloud", "https://vismart.cloud")

with open("/var/www/vismart.cloud/html/.env", "w") as f:
    f.write(text)

print("SUCCESS_UPDATED_ENV_TO_HTTPS")
