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
    
@app.route('/send-emails', methods=['POST'])
def send_emails():
    try:
        data = request.get_json()
    except:
        return jsonify({'success': False})
    assignments = data.get('assignments', []) or []
    print assignments
    # TODO
    #return jsonify({'success': True})
    for assignment in assignments:
        requests.post(
            "https://api.mailgun.net/v3/%s/messages" % os.environ['MAILGUN_DOMAIN'],
            auth=("api", os.environ['MAILGUN_API_KEY']),
            data={"from": os.environ.get('MAILGUN_FROM', "Secret Santa Mailer <secret-santa@secret-santa-flackdl.c9users.io>"),
                  "to": [assignment.buyer.email],
                  "subject": "Ssshhh... this is your Secret Santa recipient",
                  "text": "Your Secret Santa recipient is %s (%s)" % (assignment.recipient.name, assignment.recipient.email)})
    return jsonify({'success': True})
              

app.config['DEBUG'] = True
app.secret_key = os.getenv('app_secret', 'sshh')
if __name__ == "__main__":
    app.run(host=os.getenv('IP', '0.0.0.0'), port=int(os.getenv('PORT', 8080)))