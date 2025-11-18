import os
import ssl
import smtplib
from dotenv import load_dotenv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, request, render_template, jsonify, send_from_directory

# load env variables
load_dotenv()

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

    for assignment in assignments:

        subject = "Ssh...{}, this is your Secret Santa recipient".format(assignment['buyer']['name'])
        content = "Your Secret Santa recipient is %s!" % assignment['recipient']['name']

        msg = MIMEMultipart()
        msg['From'] = 'secret-santa@eerieemu.com'
        msg['To'] = assignment['buyer']['email']
        msg['Subject'] = subject

        # attach the body of the email as plain text
        msg.attach(MIMEText(content, 'plain'))

        app.logger.info('%s buys for %s' % (assignment['buyer']['email'], assignment['recipient']['name']))

        try:
            with smtplib.SMTP('smtp-relay.brevo.com', 587, timeout=10) as server:

                # secure the connection with TLS
                server.starttls(context=ssl.create_default_context())

                # authenticate to the smtp server
                server.login('9bda5b001@smtp-brevo.com', os.environ['BREVO_SMTP_KEY'])

                # send the email
                text = msg.as_string()
                server.sendmail('secret-santa@eerieemu.com', assignment['buyer']['email'], text)

            print(f"successfully sent email to {assignment['buyer']['email']}")

        # failure
        except Exception as e:
            app.logger.exception(e)
            return jsonify({'success': False}), 500

    return jsonify({'success': True})


app.config['DEBUG'] = True
app.secret_key = os.getenv('app_secret', 'sshh')
if __name__ == "__main__":
    app.run(host=os.getenv('IP', '0.0.0.0'), port=int(os.getenv('PORT', 8080)))
