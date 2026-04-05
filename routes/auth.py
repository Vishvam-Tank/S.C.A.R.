from flask import Blueprint, request, jsonify
from markupsafe import escape

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/v1/login', methods=['GET', 'POST'])
def login():
    raw_username = request.args.get('username', '') or request.form.get('username', '')
    safe_username = escape(raw_username)
    return jsonify({'status': 'success', 'message': f'Welcome, {safe_username}'})