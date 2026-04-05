from flask import Flask

app = Flask(__name__)

# SECURITY FIX: Explicitly disable debug mode in production
app.config['DEBUG'] = False
app.config['TESTING'] = False

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)