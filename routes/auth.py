"""
Authentication routes - Login and token generation
"""
import logging
from flask import Blueprint, request, jsonify

from utils.auth import get_user_from_db, verify_password, create_access_token

logger = logging.getLogger(__name__)
auth_bp = Blueprint('auth', __name__)


@auth_bp.route("/token", methods=["POST"])
def login():
    """
    Login endpoint
    Returns JWT token on successful authentication
    """
    try:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")
        
        if not username or not password:
            return jsonify({"detail": "Username and password required"}), 400
        
        # Authenticate user
        logger.info(f"🔍 Login attempt for user: {username}")
        user = get_user_from_db(username)
        
        if not user:
            logger.warning(f"❌ User not found: {username}")
            return jsonify({"detail": "Incorrect username or password"}), 401
        
        if not verify_password(password, user.get("hashed_password", "")):
            logger.warning(f"❌ Password verification failed for user: {username}")
            return jsonify({"detail": "Incorrect username or password"}), 401
        
        # Create token
        access_token = create_access_token(data={"sub": username})
        logger.info(f"✅ Login successful for user: {username}")
        
        return jsonify({
            "access_token": access_token,
            "token_type": "bearer"
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Error in login: {str(e)}")
        return jsonify({"detail": str(e)}), 500
