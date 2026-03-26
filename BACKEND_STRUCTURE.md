# Backend Architecture - Modular Structure

The backend has been refactored from a monolithic `main.py` into modular, component-based architecture similar to frontend React components.

## Directory Structure

```
experiment-project1/
├── main.py                 # Entry point - orchestrates all modules
├── config.py              # Configuration settings
├── database.py            # MongoDB connection
├── auth.py                # (Legacy, use utils/auth.py instead)
│
├── utils/                 # Reusable utilities
│   ├── __init__.py
│   ├── auth.py           # JWT & password functions
│   └── decorators.py     # @token_required decorator
│
├── services/             # Business logic services
│   ├── __init__.py
│   └── connection_manager.py  # WebSocket manager
│
├── routes/               # API endpoint blueprints (like React components)
│   ├── __init__.py
│   ├── dashboard.py      # GET / - Dashboard page
│   ├── auth.py           # POST /token - Login
│   ├── orders.py         # Order CRUD operations
│   ├── activity.py       # GET /activity - Activity logs
│   ├── feedback.py       # Feedback operations
│   └── health.py         # GET /health - Health check
│
├── events/               # WebSocket event handlers
│   ├── __init__.py
│   └── websocket.py      # Connection/disconnection/message events
│
└── public/, src/        # Frontend (React)
```

## Component Breakdown

### 1. `config.py` - Configuration
Centralized configuration for:
- JWT settings
- Flask config
- Server host/port
- Logging setup

### 2. `utils/` - Utilities
- **auth.py**: Password hashing, JWT token creation/verification, user DB lookup
- **decorators.py**: `@token_required` decorator for protected routes

### 3. `services/connection_manager.py` - WebSocket Manager
Manages active WebSocket connections and broadcasts messages to all clients when orders are updated.

### 4. `routes/` - API Endpoints (Like React Components)
Each file is responsible for a feature set:

- **dashboard.py**: Serves main page with API docs
- **auth.py**: Authentication (login, token generation)
- **orders.py**: Order operations (create, list, update, simulate)
- **activity.py**: Activity log retrieval
- **feedback.py**: User feedback submission and retrieval  
- **health.py**: Database health check

### 5. `events/websocket.py` - Real-time Events
Handles WebSocket connections:
- connection: Add to active connections
- disconnect: Remove from active connections
- message: Handle incoming messages

## Benefits

✅ **Easier Navigation** - Find related code in one place
✅ **Scalability** - Add new routes by creating new blueprint files
✅ **Reusability** - Share utilities across routes
✅ **Testing** - Test individual modules independently
✅ **Maintenance** - Changes isolated to specific features

## Running the Server

```bash
python main.py
```

Server will start on `http://0.0.0.0:5000` with WebSocket support enabled.

## Adding New Features

### Add New Routes
1. Create `routes/myfeature.py`:
```python
from flask import Blueprint, jsonify, request
from utils.decorators import token_required

myfeature_bp = Blueprint('myfeature', __name__)

@myfeature_bp.route("/myfeature", methods=["GET"])
@token_required
def my_route(current_user):
    return jsonify({"message": "Hello"}), 200
```

2. Register in `main.py`:
```python
from routes.myfeature import myfeature_bp
app.register_blueprint(myfeature_bp)
```

### Add New Services
1. Create `services/myservice.py` with your business logic
2. Import and use in routes

### Add New Utilities
1. Create functions in `utils/` for reusable logic
2. Import in routes/services as needed
