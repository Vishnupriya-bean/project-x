"""
Activity routes - Get activity logs
"""
import logging
from datetime import datetime
from flask import Blueprint, request, jsonify

from database import activity_collection
from utils.decorators import token_required

logger = logging.getLogger(__name__)
activity_bp = Blueprint('activity', __name__)


@activity_bp.route("/activity", methods=["GET"])
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
