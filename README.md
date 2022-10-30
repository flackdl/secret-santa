# Secret Santa app

A simple web app that randomly assigns secret santa recipients and emails the results to each participant.  It will follow exclusion rules, i.e couples/siblings/children can't get assigned each other.

I built this to test out [vue.js](https://vuejs.org).  The backend is running [flask](https://github.com/pallets/flask).

It's [hosted](http://sloppy-santa.herokuapp.com) on heroku for free and is using [sendgrid](http://sendgrid.com) for the email service.


## Deployment

Populate an `.env` file with your Sendgrid Api Key, something like:

    SENDGRID_API_KEY=123abc

Start app:

    docker-compose up -d --build

And it'll be accessible at http://localhost:8080

## Development

Start a Flask web server to run locally:

    python app.py
