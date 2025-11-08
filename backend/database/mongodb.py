"""MongoDB database configuration and connection"""
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection settings
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "lernova_db")

# Global database client
client: AsyncIOMotorClient = None
database = None


async def connect_to_mongo():
    """Connect to MongoDB"""
    global client, database
    try:
        client = AsyncIOMotorClient(MONGODB_URL)
        database = client[DATABASE_NAME]
        
        # Create indexes
        await create_indexes()
        
        print(f"✅ Connected to MongoDB: {DATABASE_NAME}")
    except Exception as e:
        print(f"❌ Error connecting to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
        print("✅ MongoDB connection closed")


async def create_indexes():
    """Create database indexes for better performance"""
    try:
        # Bookmarks indexes
        await database.bookmarks.create_index([("user_id", ASCENDING), ("url", ASCENDING)], unique=True)
        await database.bookmarks.create_index([("created_at", DESCENDING)])
        
        # History indexes
        await database.history.create_index([("user_id", ASCENDING), ("visited_at", DESCENDING)])
        await database.history.create_index([("url", ASCENDING)])
        
        # Settings indexes
        await database.settings.create_index([("user_id", ASCENDING)], unique=True)
        
        # Focus mode indexes
        await database.focus_sessions.create_index([("user_id", ASCENDING), ("active", ASCENDING)])
        await database.focus_sessions.create_index([("created_at", DESCENDING)])
        
        print("✅ Database indexes created")
    except Exception as e:
        print(f"⚠️ Error creating indexes: {e}")


def get_database():
    """Get database instance"""
    return database
