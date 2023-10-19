import os
from flask import Flask, request, render_template, jsonify, send_from_directory
import sendgrid
from sendgrid.helpers.mail import Email, To, Content, Mail


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
    
    app.logger.info(assignments)

    sg_client = sendgrid.SendGridAPIClient(api_key=os.environ.get('SENDGRID_API_KEY'))

    for assignment in assignments:

        app.logger.info('%s buys for %s' % (assignment['buyer']['email'], assignment['recipient']['name']))

        from_email = Email("secret-santa@eerieemu.com")
        subject = "Ssshh...{}, this is your Secret Santa recipient".format(assignment['buyer']['name'])
        to_email = To(assignment['buyer']['email'])
        content = Content("text/plain", "Your Secret Santa recipient is %s!" % assignment['recipient']['name'])
        mail = Mail(from_email, to_email, subject, content)
        response = sg_client.client.mail.send.post(request_body=mail.get())

        app.logger.info('%s, %s' % (assignment['buyer']['email'], response.status_code))
        
        # failure
        if response.status_code < 200 or response.status_code >= 300:
            app.logger.info('failed')
            return jsonify({'success': False}), 500
            
    return jsonify({'success': True})
              

app.config['DEBUG'] = True
app.secret_key = os.getenv('app_secret', 'sshh')
if __name__ == "__main__":
    app.run(host=os.getenv('IP', '0.0.0.0'), port=int(os.getenv('PORT', 8080)))
