# Realtime Logistics Dashboard

## 1. Schema (models.py)
- `Order` Pydantic model with:
  - `product_name` (string)
  - `quantity` (int)
  - `status` (`Pending`, `Picked`, `Shipped`, `Delivered`)
  - `carrier` (`DHL`, `UPS`, `DPD`)
  - `urgency` (1..5)
  - `created_at` (datetime)
  - `id` assigned by backend

## 2. Real-Time Flow (main.py)
- POST `/orders/simulate` receives order data, validates, gives unique id, saves in memory, broadcasts via WebSocket
- WS `/ws/orders` sends every order saved
- GET `/orders` list all orders

## 3. Run

```powershell
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## 4. Test simulate order

```powershell
curl -X POST http://127.0.0.1:8000/orders/simulate -H "Content-Type: application/json" -d "{\"product_name\":\"Biryani Spice Mix\",\"quantity\":1,\"status\":\"Pending\",\"carrier\":\"DHL\",\"urgency\":3,\"created_at\":\"2026-03-25T12:00:00Z\"}"
```

## 5. Note
- Saves in-memory (replace with MongoDB if needed)
- Use your React UI to connect on ws://localhost:8000/ws/orders and update rows + counts dynamically.
