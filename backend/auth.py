from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import JWTError, jwt
import json
import os

# JWT Configuration
SECRET_KEY = "your-secret-key-here-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer for JWT
security = HTTPBearer()

# Mock user database (initialize at runtime to avoid startup issues)
USERS_DB = {}

def initialize_users():
    """Initialize users with hashed passwords at runtime"""
    global USERS_DB
    if not USERS_DB:
        USERS_DB.update({
            "demo@crypto.com": {
                "id": "1",
                "email": "demo@crypto.com",
                "hashed_password": pwd_context.hash("demo123"),
                "full_name": "Demo User",
                "is_active": True
            },
            "user@example.com": {
                "id": "2", 
                "email": "user@example.com",
                "hashed_password": pwd_context.hash("password123"),
                "full_name": "John Doe",
                "is_active": True
            }
        })

class AuthService:
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a plain password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """Hash a password"""
        return pwd_context.hash(password)
    
    @staticmethod
    def get_user_by_email(email: str) -> Optional[dict]:
        """Get user by email"""
        initialize_users()  # Ensure users are initialized
        return USERS_DB.get(email)
    
    @staticmethod
    def create_user(email: str, password: str, full_name: str) -> dict:
        """Create a new user"""
        initialize_users()  # Ensure users are initialized
        user_id = str(len(USERS_DB) + 1)
        hashed_password = AuthService.get_password_hash(password)
        
        new_user = {
            "id": user_id,
            "email": email,
            "hashed_password": hashed_password,
            "full_name": full_name,
            "is_active": True
        }
        
        USERS_DB[email] = new_user
        return new_user
    
    @staticmethod
    def authenticate_user(email: str, password: str) -> Optional[dict]:
        """Authenticate user credentials"""
        initialize_users()  # Ensure users are initialized
        user = USERS_DB.get(email)
        if not user:
            return None
        if not AuthService.verify_password(password, user["hashed_password"]):
            return None
        return user
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def decode_access_token(token: str) -> Optional[dict]:
        """Decode and validate JWT token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email: str = payload.get("sub")
            if email is None:
                return None
            return {"email": email}
        except JWTError:
            return None
    
    @staticmethod
    def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
        """Get current user from JWT token"""
        initialize_users()  # Ensure users are initialized
        token = credentials.credentials
        payload = AuthService.decode_access_token(token)
        
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = USERS_DB.get(payload["email"])
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "is_active": user["is_active"]
        }

# Dependency for protected routes
def get_current_active_user(current_user: dict = Depends(AuthService.get_current_user)) -> dict:
    """Get current active user"""
    if not current_user.get("is_active"):
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user