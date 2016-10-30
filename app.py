import os
import requests
from flask import Flask, request, render_template, render_template_string, Response, session, url_for, redirect, jsonify, send_from_directory

app = Flask(__name__, static_url_path='/static')

@app.route('/<path:filename>')
def download_file(filename):
    return send_from_directory('static/', filename)


@app.route('/')
def index():
    return render_template('index.html')
    
@app.route('/send-emails')
def send_emails():
    # TODO
    return jsonify({'success': True})
    response = requests.post(
        os.environ.get('MAILGUN_URL', "https://api.mailgun.net/v3/sandbox0aa36d7567cf488592e40d28b7984119.mailgun.org/messages"),
        auth=("api", os.environ.get('MAILGUN_KEY', 'key-e8ad4beedc7ee6c094f424c70548733f')),
        data={"from": os.environ.get('MAILGUN_FROM', "Secret Santa Mailer <secret-santa@secret-santa-flackdl.c9users.io>"),
              "to": ["flackattack@gmail.com"],
              "subject": "Hello",
              "text": "Testing some Mailgun awesomness!"})
    return jsonify({'success': True})
              

app.config['DEBUG'] = True
app.secret_key = os.getenv('app_secret', 'sshh')
if __name__ == "__main__":
    app.run(host=os.getenv('IP', '0.0.0.0'), port=int(os.getenv('PORT', 8080)))