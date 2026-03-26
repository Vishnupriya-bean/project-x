"""
Decorators for Flask routes
"""
from functools import wraps
from flask import request, jsonify
from utils.auth import verify_token_sync


def token_required(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({"detail": "Invalid authorization header"}), 401
        
        if not token:
            return jsonify({"detail": "Token is missing"}), 401
        
        user = verify_token_sync(token)
        if not user:
            return jsonify({"detail": "Invalid or expired token"}), 401
        
        # Pass user to the route function
        return f(user, *args, **kwargs)
    
    return decorated
