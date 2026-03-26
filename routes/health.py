"""
Health check routes
"""
import logging
from flask import Blueprint, jsonify

from database import db, orders_collection

logger = logging.getLogger(__name__)
health_bp = Blueprint('health', __name__)


@health_bp.route("/health", methods=["GET"])
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
