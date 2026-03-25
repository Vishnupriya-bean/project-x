import uuid
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from typing import List, Dict
from datetime import datetime
from models import Order
from database import orders_collection

app = FastAPI(title="Realtime Logistics Dashboard")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

@app.post("/orders/simulate", response_model=Order)
async def simulate_order(payload: Order):
    order_dict = payload.dict()
    order_dict["id"] = str(uuid.uuid4())
    if not order_dict["created_at"]:
        order_dict["created_at"] = datetime.utcnow()
    
    # Save to MongoDB
    await orders_collection.insert_one(order_dict)
    
    # Broadcast (Convert datetime to string for JSON)
    order_dict["created_at"] = order_dict["created_at"].isoformat()
    await manager.broadcast(order_dict)
    return order_dict

@app.get("/orders", response_model=List[Order])
async def list_orders():
    orders = []
    async for order in orders_collection.find():
        orders.append(Order(**order))
    return orders

@app.websocket("/ws/orders")
async def websocket_orders(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()  # ping or ignore
    except WebSocketDisconnect:
        manager.disconnect(ws)

@app.get("/", response_class=HTMLResponse)
async def dashboard_page():
    return """
<html>
<head><title>Realtime Logistics Dashboard</title></head>
<body>
    <h1>Realtime Logistics Dashboard</h1>
    <p>Use POST /orders/simulate to add orders; WS /ws/orders to receive live updates.</p>
</body>
</html>
"""
