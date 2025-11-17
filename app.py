import os
from dotenv import load_dotenv
from flask import Flask, request, render_template, jsonify, send_from_directory
from mailersend import MailerSendClient, EmailBuilder

# load env variables
load_dotenv()

# set up the mailer-send client
ms = MailerSendClient()

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

        subject = "Ssshhh...{}, this is your Secret Santa recipient".format(assignment['buyer']['name'])
        content = "Your Secret Santa recipient is %s!" % assignment['recipient']['name']

        app.logger.info('%s buys for %s' % (assignment['buyer']['email'], assignment['recipient']['name']))

        try:
            email = (
                EmailBuilder()
                .from_email("secret-santa@test-68zxl2707634j905.mlsender.net", "Secret Santa")
                .to_many([{"email": assignment['buyer']['email'], "name": assignment['buyer']['name']}])
                .subject(subject)
                .html(content)
                .text(content)
                .build()
            )

            response = ms.emails.send(email)

            if response.status_code < 200 or response.status_code >= 300:
                raise Exception(response.body)

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
