"""
Flask API Backend - Realtime Logistics Dashboard with JWT Authentication
Main entry point - imports all modular components
"""
import logging
import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# === Import Configuration ===
from config import SECRET_KEY, HOST, PORT, LOG_FILE, LOG_LEVEL, LOG_FORMAT

# === Setup Logging ===
logging.basicConfig(
    filename=LOG_FILE,
    level=LOG_LEVEL,
    format=LOG_FORMAT
)
logger = logging.getLogger(__name__)

# Also log to console
console_handler = logging.StreamHandler()
console_handler.setLevel(LOG_LEVEL)
console_formatter = logging.Formatter(LOG_FORMAT)
console_handler.setFormatter(console_formatter)
logger.addHandler(console_handler)

# === Initialize Flask App ===
app = Flask(__name__)
app.config['SECRET_KEY'] = SECRET_KEY

# === Setup CORS ===
CORS(app, supports_credentials=True)

# === Setup SocketIO ===
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# === Import Database ===
from database import db, orders_collection

# === Register Route Blueprints ===
from routes.dashboard import dashboard_bp
from routes.auth import auth_bp
from routes.orders import orders_bp
from routes.activity import activity_bp
from routes.feedback import feedback_bp
from routes.health import health_bp

app.register_blueprint(dashboard_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(orders_bp)
app.register_blueprint(activity_bp)
app.register_blueprint(feedback_bp)
app.register_blueprint(health_bp)

# === Register WebSocket Events ===
from events.websocket import register_websocket_events
register_websocket_events(socketio)

# === Error Handlers ===
@app.errorhandler(404)
def not_found(error):
    return jsonify({"detail": "Endpoint not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    logger.error(f"❌ Internal server error: {str(error)}")
    return jsonify({"detail": "Internal server error"}), 500


# === Startup ===
def init_db():
    """Initialize database and indexes on startup"""
    try:
        db.command("ping")
        logger.info("🚀 DATABASE CONNECTION: ✅ Successfully connected to MongoDB")
        
        # Create indexes
        orders_collection.create_index([("status", 1), ("created_at", -1)])
        logger.info("🚀 INDEXES: ✅ Created indexes on orders collection")
        
        # Count existing orders
        order_count = orders_collection.count_documents({})
        logger.info(f"🚀 ORDERS IN DB: {order_count} orders available")
        
        logger.info("🚀 SERVER READY: Application started successfully!")
    except Exception as e:
        logger.error(f"🚀 STARTUP ERROR: {str(e)}")


if __name__ == "__main__":
    init_db()
    print(f"\n{'='*60}")
    print(f"🎯 Flask API Server Starting...")
    print(f"🌍 Host: {HOST}")
    print(f"🔌 Port: {PORT}")
    print(f"✨ WebSocket: Enabled (Threading mode)")
    print(f"{'='*60}\n")
    logger.info(f"🎯 Starting Flask API Server on {HOST}:{PORT}...")
    # Use socketio.run() for proper SocketIO support
    # use_reloader=False prevents Windows socket issues
    socketio.run(app, host=HOST, port=PORT, debug=False, use_reloader=False)
