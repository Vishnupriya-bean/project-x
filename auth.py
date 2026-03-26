import os
from datetime import datetime, timedelta
from typing import Optional

from dotenv import load_dotenv
import jwt
from passlib.context import CryptContext

from database import db

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "HYDERABAD_LOGISTICS_SECRET")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_user(username: str):
    user = db.users.find_one({"username": username})
    return user


def authenticate_user(username: str, password: str):
    user = get_user(username)
    print("=" * 60)
    print("🔍 AUTHENTICATION DEBUG")
    print("=" * 60)
    print(f"USERNAME RECEIVED: {username}")
    print(f"USER FROM DB: {user}")
    
    if not user:
        print("❌ USER NOT FOUND IN DATABASE")
        print("=" * 60)
        return None
    
    print(f"\n📝 INPUT PASSWORD: {password}")
    stored_hash = user.get("hashed_password", "")
    print(f"🔐 STORED HASH: {stored_hash}")
    
    result = verify_password(password, stored_hash)
    print(f"\n✅ VERIFY RESULT: {result}")
    
    if not result:
        print("❌ PASSWORD VERIFICATION FAILED - Hash/Password Mismatch")
        print("=" * 60)
        return None
    
    print("✅ AUTHENTICATION SUCCESSFUL")
    print("=" * 60)
    return user


def get_current_user(token: str):
    """Verify JWT token and return user"""
    try:
        if not token:
            return None
        
        # Remove 'Bearer ' prefix if present
        if token.startswith("Bearer "):
            token = token[7:]
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
    
    user = get_user(username)
    if user is None:
        return None
    return user


def get_current_active_user(token: str):
    """Get current active user from token"""
    return get_current_user(token)
