"""
Flask API Backend - Realtime Logistics Dashboard with JWT Authentication
Converted from FastAPI for interview preparation
"""

import uuid
import logging
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from functools import wraps
from datetime import datetime, timezone, timedelta
from typing import Dict, Optional, List
from dotenv import load_dotenv
import jwt
from passlib.context import CryptContext
import threading

# Load environment variables
load_dotenv()

# === Imports from existing modules ===
from database import orders_collection, activity_collection, feedback_collection, db

# === Configuration ===
SECRET_KEY = os.getenv("SECRET_KEY", "HYDERABAD_LOGISTICS_SECRET")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# === Logging Setup ===
logging.basicConfig(
    filename='app.log',
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s'
)
logger = logging.getLogger(__name__)

# === Flask App Setup ===
app = Flask(__name__)
app.config['SECRET_KEY'] = SECRET_KEY
CORS(app, supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins="*")

# === Security Setup ===
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def create_access_token(data: dict) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def get_user_from_db(username: str) -> Optional[dict]:
    """Fetch user from database"""
    user = db.users.find_one({"username": username})
    return user


def verify_token_sync(token: str) -> Optional[dict]:
    """Synchronous token verification"""
    if not token:
        return None
    
    # Remove 'Bearer ' prefix if present
    if token.startswith("Bearer "):
        token = token[7:]
    
    payload = decode_token(token)
    if not payload:
        return None
    
    username = payload.get("sub")
    if not username:
        return None
    
    user = get_user_from_db(username)
    return user


# === Decorators ===
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


# === WebSocket Connection Manager ===
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[str] = []
    
    def connect(self, sid: str):
        """Add new connection"""
        self.active_connections.append(sid)
        logger.info(f"📡 WebSocket connected: {sid}")
    
    def disconnect(self, sid: str):
        """Remove connection"""
        if sid in self.active_connections:
            self.active_connections.remove(sid)
            logger.info(f"📡 WebSocket disconnected: {sid}")
    
    def broadcast(self, message: Dict):
        """Broadcast message to all connected clients"""
        for sid in list(self.active_connections):
            try:
                socketio.emit('order_update', message, room=sid)
            except Exception as e:
                logger.error(f"❌ Error broadcasting to {sid}: {str(e)}")
                self.disconnect(sid)


manager = ConnectionManager()


# === Database Helper Functions ===
def insert_order_to_db(order_dict: Dict):
    """Insert order to database in background"""
    try:
        orders_collection.insert_one(order_dict)
        logger.info(f"✅ Order {order_dict['id']} successfully saved to MongoDB")
    except Exception as e:
        logger.error(f"❌ Database Error inserting order {order_dict.get('id')}: {str(e)}")


# === Routes ===

@app.route("/", methods=["GET"])
def dashboard_page():
    """Serve dashboard HTML"""
    html = """
    <html>
    <head><title>Realtime Logistics Dashboard</title></head>
    <body>
        <h1>Realtime Logistics Dashboard</h1>
        <p>Flask Backend - Interview Ready ✨</p>
        <hr>
        <h3>API Endpoints:</h3>
        <ul>
            <li><strong>POST /token</strong> - Login and get JWT token</li>
            <li><strong>POST /orders/simulate</strong> - Simulate a new order</li>
            <li><strong>POST /orders</strong> - Create manual order</li>
            <li><strong>GET /orders</strong> - List all orders</li>
            <li><strong>PATCH /orders/&lt;order_id&gt;</strong> - Update order status</li>
            <li><strong>GET /activity</strong> - Get activity logs</li>
            <li><strong>POST /feedback</strong> - Submit feedback</li>
            <li><strong>GET /feedback</strong> - Get feedbacks</li>
            <li><strong>GET /health</strong> - Health check</li>
        </ul>
    </body>
    </html>
    """
    return html, 200, {'Content-Type': 'text/html'}


@app.route("/token", methods=["POST"])
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


@app.route("/orders/simulate", methods=["POST"])
@token_required
def simulate_order(current_user):
    """Simulate a new order"""
    try:
        payload = request.get_json()
        logger.info(f"Received order simulation payload: {payload}")
        
        order_dict = payload.copy()
        order_dict["id"] = str(uuid.uuid4())
        
        if not order_dict.get("created_at"):
            order_dict["created_at"] = datetime.now(timezone.utc)
        
        # Insert to DB in background thread
        thread = threading.Thread(target=insert_order_to_db, args=(order_dict.copy(),))
        thread.start()
        
        # Convert datetime to ISO string for broadcast
        order_dict_broadcast = order_dict.copy()
        if isinstance(order_dict_broadcast.get("created_at"), datetime):
            order_dict_broadcast["created_at"] = order_dict_broadcast["created_at"].isoformat()
        
        # Broadcast to WebSocket clients
        manager.broadcast(order_dict_broadcast)
        
        # Convert for response
        if isinstance(order_dict.get("created_at"), datetime):
            order_dict["created_at"] = order_dict["created_at"].isoformat()
        
        return jsonify(order_dict), 201
    
    except Exception as e:
        logger.error(f"❌ Error simulating order: {str(e)}")
        return jsonify({"detail": str(e)}), 400


@app.route("/orders", methods=["POST"])
@token_required
def create_manual_order(current_user):
    """Create a manual order with 7-day urgency escalation logic"""
    try:
        payload = request.get_json()
        logger.info(f"📝 Received manual order payload: {payload}")
        
        order_dict = payload.copy()
        order_dict["id"] = str(uuid.uuid4())
        
        # Set created_at
        if not order_dict.get("created_at"):
            order_dict["created_at"] = datetime.now(timezone.utc)
        elif isinstance(order_dict["created_at"], str):
            order_dict["created_at"] = datetime.fromisoformat(
                order_dict["created_at"].replace('Z', '+00:00')
            )
        
        # 7-Day Urgency Escalation Logic
        today = datetime.now(timezone.utc)
        order_date = order_dict["created_at"]
        days_old = (today - order_date).days if isinstance(order_date, datetime) else 0
        
        if days_old >= 7 and order_dict.get("status") != "Delivered":
            order_dict["urgency"] = 5
            logger.warning(
                f"🚨 Order {order_dict.get('product_name')} "
                f"(ID: {order_dict['id']}) flagged as Critical (7+ days old)"
            )
        
        # Insert to DB in background
        thread = threading.Thread(target=insert_order_to_db, args=(order_dict.copy(),))
        thread.start()
        
        # Broadcast to WebSocket
        order_dict_broadcast = order_dict.copy()
        if isinstance(order_dict_broadcast.get("created_at"), datetime):
            order_dict_broadcast["created_at"] = order_dict_broadcast["created_at"].isoformat()
        manager.broadcast(order_dict_broadcast)
        
        # Response
        if isinstance(order_dict.get("created_at"), datetime):
            order_dict["created_at"] = order_dict["created_at"].isoformat()
        
        return jsonify(order_dict), 201
    
    except Exception as e:
        logger.error(f"❌ Error creating order: {str(e)}")
        return jsonify({"detail": str(e)}), 400


@app.route("/orders", methods=["GET"])
@token_required
def list_orders(current_user):
    """Fetch all orders"""
    try:
        limit = request.args.get("limit", default=50, type=int)
        skip = request.args.get("skip", default=0, type=int)
        
        orders = []
        cursor = orders_collection.find().sort("created_at", -1).skip(skip).limit(limit)
        
        for order in cursor:
            order_dict = dict(order)
            order_dict["id"] = str(order_dict.pop("_id", ""))
            
            # Convert datetime fields to ISO strings
            for field in ["created_at", "shipped_at", "delivered_at", "picked_at"]:
                if isinstance(order_dict.get(field), datetime):
                    order_dict[field] = order_dict[field].isoformat()
                elif not isinstance(order_dict.get(field), str) and order_dict.get(field) is not None:
                    order_dict[field] = None
            
            orders.append(order_dict)
        
        logger.info(f"✅ Fetched {len(orders)} orders for user {current_user.get('username')}")
        return jsonify(orders), 200
    
    except Exception as e:
        logger.error(f"❌ Error fetching orders: {str(e)}")
        return jsonify({"detail": str(e)}), 500


@app.route("/orders/<order_id>", methods=["PATCH"])
@token_required
def update_order(current_user, order_id):
    """Update order status"""
    try:
        payload = request.get_json()
        logger.info(f"📝 Updating order {order_id} with: {payload}")
        
        from bson import ObjectId
        
        # Try to find by 'id' field first
        existing = orders_collection.find_one({"id": order_id})
        query_filter = {"id": order_id}
        
        if not existing:
            try:
                existing = orders_collection.find_one({"_id": ObjectId(order_id)})
                query_filter = {"_id": ObjectId(order_id)}
            except:
                pass
        
        if not existing:
            logger.error(f"❌ Order not found: '{order_id}'")
            return jsonify({"detail": f"Order '{order_id}' not found"}), 404
        
        # Validate status
        if "status" in payload:
            valid_statuses = ["Pending", "Picked", "Shipped", "Delivered"]
            if payload["status"] not in valid_statuses:
                return jsonify({"detail": f"Invalid status. Must be one of: {valid_statuses}"}), 422
        
        # Set timestamps based on status
        timestamp_updates = {}
        if "status" in payload:
            new_status = payload["status"]
            if new_status == "Picked":
                timestamp_updates["picked_at"] = datetime.now(timezone.utc)
            elif new_status == "Shipped":
                timestamp_updates["shipped_at"] = datetime.now(timezone.utc)
            elif new_status == "Delivered":
                timestamp_updates["delivered_at"] = datetime.now(timezone.utc)
                payload["payment"] = "Done"
                logger.info(f"💰 Order {order_id} marked as DELIVERED - auto-marking payment as DONE")
        
        # Combine updates
        full_update = {**payload, **timestamp_updates}
        
        # Update order
        result = orders_collection.update_one(query_filter, {"$set": full_update})
        
        if result.modified_count == 0:
            logger.error(f"❌ Failed to modify order {order_id}")
            return jsonify({"detail": "Failed to update order"}), 400
        
        # Fetch updated order
        updated = orders_collection.find_one(query_filter)
        logger.info(f"✅ Order {order_id} updated to status {payload.get('status')}")
        
        # Log activity
        if "status" in payload:
            activity_collection.insert_one({
                "order_id": order_id,
                "status": payload["status"],
                "timestamp": datetime.now(timezone.utc),
                "user": current_user.get("username")
            })
        
        # Format response
        updated_dict = dict(updated)
        if "id" not in updated_dict and "_id" in updated_dict:
            updated_dict["id"] = str(updated_dict["_id"])
        if "_id" in updated_dict:
            del updated_dict["_id"]
        
        # Convert datetime fields
        for field in ["created_at", "shipped_at", "delivered_at", "picked_at"]:
            if isinstance(updated_dict.get(field), datetime):
                updated_dict[field] = updated_dict[field].isoformat()
        
        # Broadcast update
        manager.broadcast(updated_dict)
        
        return jsonify(updated_dict), 200
    
    except Exception as e:
        logger.error(f"❌ Error updating order {order_id}: {str(e)}")
        return jsonify({"detail": str(e)}), 500


@app.route("/activity", methods=["GET"])
@token_required
def get_activity(current_user):
    """Fetch activity logs"""
    try:
        limit = request.args.get("limit", default=50, type=int)
        
        activities = []
        cursor = activity_collection.find().sort("timestamp", -1).limit(limit)
        
        for activity in cursor:
            activity_dict = dict(activity)
            activity_dict["id"] = str(activity_dict.pop("_id", ""))
            
            if isinstance(activity_dict.get("timestamp"), datetime):
                activity_dict["timestamp"] = activity_dict["timestamp"].isoformat()
            
            activities.append(activity_dict)
        
        logger.info(f"✅ Fetched {len(activities)} activity logs")
        return jsonify(activities), 200
    
    except Exception as e:
        logger.error(f"❌ Error fetching activity: {str(e)}")
        return jsonify({"detail": str(e)}), 500


@app.route("/feedback", methods=["POST"])
@token_required
def submit_feedback(current_user):
    """Submit feedback/review"""
    try:
        payload = request.get_json()
        logger.info(f"📝 Feedback submission from {current_user.get('username')}")
        
        # Validate feedback
        if not payload.get("productName"):
            return jsonify({"detail": "Product name is required"}), 400
        if not payload.get("review"):
            return jsonify({"detail": "Review is required"}), 400
        if not payload.get("rating"):
            return jsonify({"detail": "Rating is required"}), 400
        
        feedback_doc = {
            "productName": payload["productName"],
            "productId": payload.get("productId", "N/A"),
            "review": payload["review"],
            "rating": int(payload["rating"]),
            "submittedBy": current_user.get("username"),
            "timestamp": datetime.now(timezone.utc)
        }
        
        result = feedback_collection.insert_one(feedback_doc)
        logger.info(f"✅ Feedback submitted for {payload.get('productName')}")
        
        return jsonify({
            "status": "success",
            "message": "Thank you for your feedback!",
            "feedback_id": str(result.inserted_id)
        }), 201
    
    except Exception as e:
        logger.error(f"❌ Error submitting feedback: {str(e)}")
        return jsonify({"detail": str(e)}), 500


@app.route("/feedback", methods=["GET"])
@token_required
def get_feedback(current_user):
    """Fetch feedback/reviews"""
    try:
        product_name = request.args.get("product_name", default=None, type=str)
        limit = request.args.get("limit", default=50, type=int)
        
        query = {"productName": product_name} if product_name else {}
        
        feedback_list = []
        cursor = feedback_collection.find(query).sort("timestamp", -1).limit(limit)
        
        for feedback in cursor:
            feedback_dict = dict(feedback)
            feedback_dict["id"] = str(feedback_dict.pop("_id", ""))
            
            if isinstance(feedback_dict.get("timestamp"), datetime):
                feedback_dict["timestamp"] = feedback_dict["timestamp"].isoformat()
            
            feedback_list.append(feedback_dict)
        
        logger.info(f"✅ Fetched {len(feedback_list)} feedback entries")
        return jsonify(feedback_list), 200
    
    except Exception as e:
        logger.error(f"❌ Error fetching feedback: {str(e)}")
        return jsonify({"detail": str(e)}), 500


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    try:
        db.command("ping")
        order_count = orders_collection.count_documents({})
        logger.info(f"✅ Database healthy. Total orders: {order_count}")
        
        return jsonify({
            "status": "ok",
            "database": "connected",
            "total_orders": order_count
        }), 200
    
    except Exception as e:
        logger.error(f"❌ Health check failed: {str(e)}")
        return jsonify({"detail": f"Database unavailable: {str(e)}"}), 503


# === WebSocket Events ===

@socketio.on("connect")
def handle_connect():
    """Handle WebSocket connection"""
    logger.info(f"📡 WebSocket client connected: {request.sid}")
    manager.connect(request.sid)
    emit("connection_response", {"data": "Connected to server"})


@socketio.on("disconnect")
def handle_disconnect():
    """Handle WebSocket disconnection"""
    logger.info(f"📡 WebSocket client disconnected: {request.sid}")
    manager.disconnect(request.sid)


@socketio.on("message")
def handle_message(data):
    """Handle incoming WebSocket message"""
    logger.info(f"📨 Received message from {request.sid}: {data}")


@app.route("/ws/orders", methods=["GET"])
def websocket_orders():
    """Placeholder for WebSocket endpoint (handled by socketio)"""
    return jsonify({"message": "Use WebSocket connection instead"}), 400


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
    logger.info("🎯 Starting Flask API Server on port 8001...")
    # Start Flask app directly without debug reloader (causes Windows socket issues)
    app.run(host="127.0.0.1", port=8001, debug=False)
