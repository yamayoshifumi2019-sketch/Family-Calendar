"""
Family Calendar Web App - Flask Backend
========================================
A simple shared calendar for a family of 4 members.
Provides REST API endpoints for event management and user sessions.
"""

from flask import Flask, render_template, request, jsonify, session
import sqlite3
from datetime import datetime
import os

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'family-calendar-secret-key-2024')

# Database file path
DATABASE = 'family_calendar.db'


def get_db_connection():
    """Create a database connection and return it."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row  # This allows accessing columns by name
    return conn


# ===================
# Page Routes
# ===================

@app.route('/')
def index():
    """Serve the main calendar page."""
    return render_template('index.html')


# ===================
# User API Endpoints
# ===================

@app.route('/api/users', methods=['GET'])
def get_users():
    """Get all family members."""
    conn = get_db_connection()
    users = conn.execute('SELECT * FROM users ORDER BY id').fetchall()
    conn.close()

    # Convert to list of dictionaries
    return jsonify([dict(user) for user in users])


@app.route('/api/login', methods=['POST'])
def login():
    """Log in as a family member (simple selection, no password)."""
    data = request.get_json()
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400

    # Verify user exists
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()

    if not user:
        return jsonify({'error': 'User not found'}), 404

    # Store user in session
    session['user_id'] = user['id']
    session['user_name'] = user['name']

    return jsonify({
        'message': 'Logged in successfully',
        'user': dict(user)
    })


@app.route('/api/logout', methods=['POST'])
def logout():
    """Log out the current user."""
    session.clear()
    return jsonify({'message': 'Logged out successfully'})


@app.route('/api/current-user', methods=['GET'])
def get_current_user():
    """Get the currently logged-in user."""
    if 'user_id' not in session:
        return jsonify({'user': None})

    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],)).fetchone()
    conn.close()

    if user:
        return jsonify({'user': dict(user)})
    return jsonify({'user': None})


# ===================
# Title Suggestions API
# ===================

@app.route('/api/saved-titles', methods=['GET'])
def get_saved_titles():
    """Get distinct event titles for the logged-in user (for suggestions)."""
    if 'user_id' not in session:
        return jsonify({'titles': []})

    user_id = session['user_id']
    conn = get_db_connection()

    # Get distinct titles from user's events, ordered by most recent usage
    titles = conn.execute('''
        SELECT title, MAX(created_at) as last_used
        FROM events
        WHERE user_id = ?
        GROUP BY title
        ORDER BY last_used DESC
        LIMIT 10
    ''', (user_id,)).fetchall()

    conn.close()
    return jsonify({'titles': [t['title'] for t in titles]})


# ===================
# Event API Endpoints
# ===================

@app.route('/api/events', methods=['GET'])
def get_events():
    """
    Get events, optionally filtered by year and month.
    Query params: year (optional), month (optional)
    """
    year = request.args.get('year')
    month = request.args.get('month')

    conn = get_db_connection()

    if year and month:
        # Filter by year and month
        # Date format in DB: YYYY-MM-DD
        start_date = f"{year}-{month:0>2}-01"
        if int(month) == 12:
            end_date = f"{int(year)+1}-01-01"
        else:
            end_date = f"{year}-{int(month)+1:0>2}-01"

        events = conn.execute('''
            SELECT e.*, u.name as user_name, u.color as user_color
            FROM events e
            JOIN users u ON e.user_id = u.id
            WHERE e.date >= ? AND e.date < ?
            ORDER BY e.date, e.start_time
        ''', (start_date, end_date)).fetchall()
    else:
        # Get all events
        events = conn.execute('''
            SELECT e.*, u.name as user_name, u.color as user_color
            FROM events e
            JOIN users u ON e.user_id = u.id
            ORDER BY e.date, e.start_time
        ''').fetchall()

    conn.close()
    return jsonify([dict(event) for event in events])


@app.route('/api/events', methods=['POST'])
def create_event():
    """Create a new event."""
    # Check if user is logged in
    if 'user_id' not in session:
        return jsonify({'error': 'Please log in first'}), 401

    data = request.get_json()

    # Validate required fields
    title = data.get('title', '').strip()
    date = data.get('date')
    start_time = data.get('start_time', '')  # Optional
    end_time = data.get('end_time', '')  # Optional
    user_id = data.get('user_id', session['user_id'])  # Default to current user

    if not title:
        return jsonify({'error': 'Title is required'}), 400
    if not date:
        return jsonify({'error': 'Date is required'}), 400

    # Insert into database
    conn = get_db_connection()
    cursor = conn.execute('''
        INSERT INTO events (title, date, start_time, end_time, user_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (title, date, start_time or None, end_time or None, user_id, datetime.now().isoformat()))

    event_id = cursor.lastrowid

    # Fetch the created event with user info
    event = conn.execute('''
        SELECT e.*, u.name as user_name, u.color as user_color
        FROM events e
        JOIN users u ON e.user_id = u.id
        WHERE e.id = ?
    ''', (event_id,)).fetchone()

    conn.commit()
    conn.close()

    return jsonify(dict(event)), 201


@app.route('/api/events/<int:event_id>', methods=['GET'])
def get_event(event_id):
    """Get a single event by ID."""
    conn = get_db_connection()
    event = conn.execute('''
        SELECT e.*, u.name as user_name, u.color as user_color
        FROM events e
        JOIN users u ON e.user_id = u.id
        WHERE e.id = ?
    ''', (event_id,)).fetchone()
    conn.close()

    if not event:
        return jsonify({'error': 'Event not found'}), 404

    return jsonify(dict(event))


@app.route('/api/events/<int:event_id>', methods=['PUT'])
def update_event(event_id):
    """Update an existing event."""
    # Check if user is logged in
    if 'user_id' not in session:
        return jsonify({'error': 'Please log in first'}), 401

    data = request.get_json()

    # Validate required fields
    title = data.get('title', '').strip()
    date = data.get('date')
    start_time = data.get('start_time', '')
    end_time = data.get('end_time', '')
    user_id = data.get('user_id')

    if not title:
        return jsonify({'error': 'Title is required'}), 400
    if not date:
        return jsonify({'error': 'Date is required'}), 400

    conn = get_db_connection()

    # Check if event exists
    existing = conn.execute('SELECT * FROM events WHERE id = ?', (event_id,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({'error': 'Event not found'}), 404

    # Update event
    conn.execute('''
        UPDATE events
        SET title = ?, date = ?, start_time = ?, end_time = ?, user_id = ?
        WHERE id = ?
    ''', (title, date, start_time or None, end_time or None, user_id, event_id))

    # Fetch updated event
    event = conn.execute('''
        SELECT e.*, u.name as user_name, u.color as user_color
        FROM events e
        JOIN users u ON e.user_id = u.id
        WHERE e.id = ?
    ''', (event_id,)).fetchone()

    conn.commit()
    conn.close()

    return jsonify(dict(event))


@app.route('/api/events/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    """Delete an event."""
    # Check if user is logged in
    if 'user_id' not in session:
        return jsonify({'error': 'Please log in first'}), 401

    conn = get_db_connection()

    # Check if event exists
    existing = conn.execute('SELECT * FROM events WHERE id = ?', (event_id,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({'error': 'Event not found'}), 404

    # Delete event
    conn.execute('DELETE FROM events WHERE id = ?', (event_id,))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Event deleted successfully'})


# ===================
# Run the Application
# ===================

if __name__ == '__main__':
    # Check if database exists, if not, prompt to initialize
    if not os.path.exists(DATABASE):
        print("=" * 50)
        print("Database not found!")
        print("Please run: python init_db.py")
        print("=" * 50)
        exit(1)

    # Run Flask development server
    print("=" * 50)
    print("Family Calendar App")
    print("Open http://localhost:5000 in your browser")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5000)
