"""
Configuration and Settings for Flask API Backend
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Secret Key
SECRET_KEY = os.getenv("SECRET_KEY", "HYDERABAD_LOGISTICS_SECRET")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# Flask Config
FLASK_ENV = os.getenv("FLASK_ENV", "development")
DEBUG = FLASK_ENV == "development"

# Server
HOST = "0.0.0.0"
PORT = 5000

# Logging
LOG_FILE = 'app.log'
LOG_LEVEL = 'INFO'
LOG_FORMAT = '%(asctime)s %(levelname)s %(message)s'
