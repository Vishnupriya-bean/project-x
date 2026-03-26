import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Securely fetch from .env
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    print("❌ ERROR: MONGO_URI not found in .env file!")
    print("Please add MONGO_URI=<your_connection_string> to .env")
    raise ValueError("MONGO_URI environment variable is required")

try:
    # Use synchronous pymongo client for Flask
    client = MongoClient(
        MONGO_URI,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=10000,
        retryWrites=True,
        maxPoolSize=20
    )
    
    # Test connection
    client.admin.command('ping')
    
    db = client.logistics_db
    orders_collection = db.orders
    activity_collection = db.activity
    feedback_collection = db.feedback
    
    print("✅ Successfully connected to MongoDB Atlas! 🚀")
    print(f"📊 Database: {db.name}")
    print(f"📦 Collections: orders, activity, feedback")
    
except Exception as e:
    print(f"❌ Could not connect to MongoDB: {e}")
    print("🔍 Troubleshooting:")
    print("  1. Verify MONGODB_URL in .env is correct")
    print("  2. Check MongoDB Atlas cluster is active")
    print("  3. Ensure IP whitelist includes your connection")
    raise