"""
WebSocket events - Real-time updates
"""
import logging
from flask import request
from flask_socketio import emit

from services.connection_manager import manager

logger = logging.getLogger(__name__)


def register_websocket_events(socketio):
    """Register all WebSocket events with the app"""
    
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
