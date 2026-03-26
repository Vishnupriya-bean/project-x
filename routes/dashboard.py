"""
Dashboard routes
"""
from flask import Blueprint

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route("/", methods=["GET"])
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
