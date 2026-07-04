import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./archon.db")

# Fallback mechanism if Postgres connection fails (e.g. running locally without Docker)
try:
    if DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://"):
        # Check connection
        engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 3})
        connection = engine.connect()
        connection.close()
        print("Connected to PostgreSQL database.")
    else:
        # SQLite
        engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
        print("Connected to SQLite database.")
except Exception as e:
    print(f"Database connection failed: {e}. Falling back to SQLite.")
    DATABASE_URL = "sqlite:///./archon.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
