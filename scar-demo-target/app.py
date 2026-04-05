from flask import Flask, request

app = Flask(__name__, static_folder='static', static_url_path='/static')

@app.route('/api/v1/login')
def login():
    username = request.args.get('username', '')
    return username

@app.route('/api/debug')
def debug():
    raise Exception("Intentional Exception")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
