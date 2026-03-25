import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

# Securely fetch from .env
MONGODB_URL = os.getenv("MONGODB_URL")

try:
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client.logistics_db
    orders_collection = db.orders
    print("Successfully connected to MongoDB Atlas! 🚀")
except Exception as e:
    print(f"Could not connect to MongoDB: {e}")