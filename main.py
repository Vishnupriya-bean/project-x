import uuid
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from typing import List, Dict, Optional
from datetime import datetime
from models import Order, OrderStatus
from database import orders_collection, db

# Logging setup
logging.basicConfig(filename='app.log', level=logging.INFO,
                    format='%(asctime)s %(levelname)s %(message)s')

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

def insert_order_to_db(order_dict: Dict):
    orders_collection.insert_one(order_dict)

@app.post("/orders/simulate", response_model=Order)
async def simulate_order(payload: Order, background_tasks: BackgroundTasks):
    logging.info(f"Received order simulation payload: {payload}")

    order_dict = payload.dict()
    order_dict["id"] = str(uuid.uuid4())
    if not order_dict.get("created_at"):
        order_dict["created_at"] = datetime.utcnow()

    background_tasks.add_task(insert_order_to_db, order_dict.copy())

    order_dict["created_at"] = order_dict["created_at"].isoformat()
    await manager.broadcast(order_dict)

    return order_dict

@app.get("/orders", response_model=List[Order])
async def list_orders(limit: int = 50, skip: int = 0):
    orders = []
    cursor = orders_collection.find().sort("created_at", -1).skip(skip).limit(limit)
    async for order in cursor:
        orders.append(Order(**order))
    return orders

@app.patch("/orders/{order_id}", response_model=Order)
async def update_order(order_id: str, update: Dict[str, Optional[str]]):
    existing = await orders_collection.find_one({"id": order_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Order not found")

    if "status" in update:
        if update["status"] not in [s.value for s in OrderStatus]:
            raise HTTPException(status_code=422, detail="Invalid status value")

    await orders_collection.update_one({"id": order_id}, {"$set": update})
    updated = await orders_collection.find_one({"id": order_id})
    await manager.broadcast({**updated, "created_at": updated["created_at"].isoformat() if isinstance(updated.get("created_at"), datetime) else updated.get("created_at")})
    return Order(**updated)

@app.get("/orders/optimized-route", response_model=List[Order])
async def get_optimized_route(w1: float = 1.0, w2: float = 1.0):
    orders = []
    async for order in orders_collection.find({"status": "Pending"}):
        orders.append(Order(**order))

    # For demonstration, use pseudo distance from area as a value
    area_priority = {
        "Gachibowli": 1.0,
        "Kukatpally": 1.2,
        "Banjara Hills": 1.4,
        "Charminar": 1.1
    }

    def priority(order: Order):
        distance = area_priority.get(order.area, 2.0)
        return w1 * distance + w2 * (6 - order.urgency)

    sorted_orders = sorted(orders, key=priority)
    return sorted_orders

@app.get("/health")
async def health_check():
    try:
        await db.command("ping")
        return {"status": "ok"}
    except Exception as err:
        logging.error(f"Health check failed: {err}")
        raise HTTPException(status_code=503, detail="Database unavailable")

@app.websocket("/ws/orders")
async def websocket_orders(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()  # ping or ignore
    except WebSocketDisconnect:
        manager.disconnect(ws)


@app.on_event("startup")
async def startup_event():
    # Create indexes for better query performance
    await orders_collection.create_index([("status", 1), ("created_at", -1)])
    logging.info("MongoDB indexes ensured")

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
