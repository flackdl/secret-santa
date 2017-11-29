import os
import logging
import requests
from flask import Flask, request, render_template, render_template_string, Response, session, url_for, redirect, jsonify, send_from_directory
import sendgrid
from sendgrid.helpers import mail as sg_mail

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
        return jsonify({'success': False}), 500
        
    assignments = data.get('assignments', []) or []
    
    logging.info(assignments)
    
    for assignment in assignments:
        
        sg = sendgrid.SendGridAPIClient(apikey=os.environ.get('SENDGRID_API_KEY'))
        from_email = sg_mail.Email("secret-santa@vecinos.xyz")
        subject = "Ssshh...{}, this is your Secret Santa recipient".format(assignment['buyer']['name'])
        to_email = sg_mail.Email(assignment['buyer']['email'])
        content = sg_mail.Content("text/plain", "Your Secret Santa recipient is %s!" % assignment['recipient']['name'])
        mail = sg_mail.Mail(from_email, subject, to_email, content)
        response = sg.client.mail.send.post(request_body=mail.get())
        
        logging.info('%s, %s' % (assignment['buyer']['email'], response.status_code))
        
        # failure
        if response.status_code < 200 or response.status_code >= 300:
            logging.info('failed')
            return jsonify({'success': False}), 500
            
    return jsonify({'success': True})
              

app.config['DEBUG'] = True
app.secret_key = os.getenv('app_secret', 'sshh')
if __name__ == "__main__":
    app.run(host=os.getenv('IP', '0.0.0.0'), port=int(os.getenv('PORT', 8080)))
