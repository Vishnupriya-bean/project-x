import os
from datetime import datetime, timedelta
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext

from database import db

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "HYDERABAD_LOGISTICS_SECRET")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

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


async def get_user(username: str):
    user = await db.users.find_one({"username": username})
    return user


async def authenticate_user(username: str, password: str):
    user = await get_user(username)
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


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = await get_user(username)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(current_user: dict = Depends(get_current_user)):
    # placeholder for future status checks
    return current_user
