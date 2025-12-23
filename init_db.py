"""
Database Initialization Script
==============================
Creates the SQLite database and populates it with:
- 4 family members (users)
- Empty events table

Run this script once before starting the application:
    python init_db.py
"""

import sqlite3
import os

DATABASE = 'family_calendar.db'


def init_database():
    """Initialize the database with tables and default data."""

    # Remove existing database if it exists (fresh start)
    if os.path.exists(DATABASE):
        print(f"Removing existing database: {DATABASE}")
        os.remove(DATABASE)

    # Connect to database (creates it if doesn't exist)
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    print("Creating tables...")

    # Create users table
    cursor.execute('''
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            color TEXT NOT NULL
        )
    ''')

    # Create events table
    cursor.execute('''
        CREATE TABLE events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT,
            user_id INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    # Create index for faster date-based queries
    cursor.execute('''
        CREATE INDEX idx_events_date ON events (date)
    ''')

    print("Inserting family members...")

    # Insert 4 family members with distinct colors
    # Colors are chosen to be easily distinguishable and visually pleasing
    family_members = [
        ('Family Member A', '#4A90D9'),  # Blue
        ('Family Member B', '#D94A4A'),  # Red
        ('Family Member C', '#4AD97B'),  # Green
        ('Family Member D', '#D9A84A'),  # Orange
    ]

    cursor.executemany(
        'INSERT INTO users (name, color) VALUES (?, ?)',
        family_members
    )

    # Commit changes and close connection
    conn.commit()
    conn.close()

    print("=" * 50)
    print("Database initialized successfully!")
    print(f"Database file: {DATABASE}")
    print("")
    print("Family members created:")
    for name, color in family_members:
        print(f"  - {name} ({color})")
    print("")
    print("You can now run the app with: python app.py")
    print("=" * 50)


if __name__ == '__main__':
    init_database()
