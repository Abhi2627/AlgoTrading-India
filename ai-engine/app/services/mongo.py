import motor.motor_asyncio
import os
from dotenv import load_dotenv
from pathlib import Path

# --- DEBUGGING PATHS ---
# 1. Get the path of THIS file (mongo.py)
current_file = Path(__file__).resolve()

# 2. Go up 3 levels to find 'ai-engine' root
# app/services/mongo.py -> app/services -> app -> ai-engine
project_root = current_file.parent.parent.parent
env_path = project_root / ".env"

print(f"📍 Debug: Project Root is detected as: {project_root}")
print(f"🔍 Debug: Looking for .env file at: {env_path}")

if env_path.exists():
    print("✅ Debug: .env file FOUND!")
else:
    print("❌ Debug: .env file NOT FOUND at this location.")

# 3. Load the file
load_dotenv(dotenv_path=env_path)

class MongoDB:
    client: motor.motor_asyncio.AsyncIOMotorClient = None
    db = None

    def connect(self):
        """Connect to MongoDB Cloud"""
        mongo_url = os.getenv("MONGO_URL")
        
        if not mongo_url:
            print("⚠️ MONGO_URL variable is empty. Did .env load correctly?")
            return

        try:
            self.client = motor.motor_asyncio.AsyncIOMotorClient(mongo_url)
            self.db = self.client.algotrade 
            print("✅ Connected to MongoDB Atlas (algotrade DB)")
        except Exception as e:
            print(f"❌ Database Connection Error: {e}")

    async def close(self):
        if self.client:
            self.client.close()
            print("🔒 MongoDB Connection Closed")

    async def save_prediction(self, data: dict):
        if self.db is not None:
            await self.db.predictions.insert_one(data)
        else:
            print("⚠️ Data NOT saved (Database not connected)")

db = MongoDB()