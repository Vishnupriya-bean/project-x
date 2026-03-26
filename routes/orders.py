"""
Order routes - CRUD operations for orders
"""
import uuid
import logging
import threading
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from bson import ObjectId

from database import orders_collection, activity_collection
from utils.decorators import token_required
from services.connection_manager import manager

logger = logging.getLogger(__name__)
orders_bp = Blueprint('orders', __name__)


def insert_order_to_db(order_dict):
    """Insert order to database in background"""
    try:
        orders_collection.insert_one(order_dict)
        logger.info(f"✅ Order {order_dict['id']} successfully saved to MongoDB")
    except Exception as e:
        logger.error(f"❌ Database Error inserting order {order_dict.get('id')}: {str(e)}")


@orders_bp.route("/orders/simulate", methods=["POST"])
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


@orders_bp.route("/orders", methods=["POST"])
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


@orders_bp.route("/orders", methods=["GET"])
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


@orders_bp.route("/orders/<order_id>", methods=["PATCH"])
@token_required
def update_order(current_user, order_id):
    """Update order status"""
    try:
        payload = request.get_json()
        logger.info(f"📝 Updating order {order_id} with: {payload}")
        
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
