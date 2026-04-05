from markupsafe import escape

@login_bp.route('/api/v1/login')
def login():
    username = request.args.get('username', '')
    safe_username = escape(username)
    return f'Login attempt for user: {safe_username}'
