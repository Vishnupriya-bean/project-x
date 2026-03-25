import asyncio
from database import db
from auth import get_password_hash

async def create_admin():
    existing = await db.users.find_one({"username": "admin"})
    if existing:
        print("Admin user already exists")
        return

    hashed = get_password_hash("hyderabad2026")
    await db.users.insert_one({
        "username": "admin",
        "hashed_password": hashed,
        "role": "admin"
    })
    print("Admin user created with hashed password! ✅")

if __name__ == '__main__':
    asyncio.run(create_admin())
