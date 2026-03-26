"""
Feedback routes - Submit and retrieve feedback/reviews
"""
import logging
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify

from database import feedback_collection
from utils.decorators import token_required

logger = logging.getLogger(__name__)
feedback_bp = Blueprint('feedback', __name__)


@feedback_bp.route("/feedback", methods=["POST"])
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


@feedback_bp.route("/feedback", methods=["GET"])
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
