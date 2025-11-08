from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure
import os
from dotenv import load_dotenv

load_dotenv()

client: AsyncIOMotorClient = None
database: AsyncIOMotorDatabase = None

async def init_db():
    """Initialize MongoDB connection"""
    global client, database
    
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB_NAME", "genai_browser")
    
    try:
        client = AsyncIOMotorClient(mongodb_url)
        await client.admin.command('ping')
        database = client[db_name]
        print(f"✓ Connected to MongoDB: {db_name}")
    except ConnectionFailure as e:
        print(f"✗ MongoDB connection failed: {e}")
        raise

async def close_db():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
        print("✓ Disconnected from MongoDB")

def get_database() -> AsyncIOMotorDatabase:
    """Get database instance"""
    return database

