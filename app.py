import os
from flask import Flask, request, render_template, render_template_string, Response, session, url_for, redirect, jsonify, send_from_directory

app = Flask(__name__, static_url_path='/static')

@app.route('/css/<path:filename>')
def download_file(filename):
    return send_from_directory('static/css', filename)


@app.route('/')
def index():
    return render_template('index.html')

app.config['DEBUG'] = True
app.secret_key = os.getenv('app_secret', 'sshh')
if __name__ == "__main__":
    app.run(host=os.getenv('IP', '0.0.0.0'), port=int(os.getenv('PORT', 8080)))