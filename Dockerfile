FROM python:3.10-buster
ADD . /app
WORKDIR /app
RUN pip install -U pip
RUN pip install -r requirements.txt
ENTRYPOINT gunicorn -b :80 app:app
