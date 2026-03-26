"""
WebSocket Connection Manager for real-time updates
"""
import logging
from typing import List, Dict
from flask_socketio import emit

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manage WebSocket connections and broadcast messages"""
    
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
                emit('order_update', message, room=sid)
            except Exception as e:
                logger.error(f"❌ Error broadcasting to {sid}: {str(e)}")
                self.disconnect(sid)


# Global instance
manager = ConnectionManager()
