"""
Clockt SQLite database management.

Stores activity records locally and uses the central
configuration module for database location.
"""

import sqlite3

from config import DATABASE_PATH


def get_connection():
    """
    Open a connection to the configured SQLite database.
    """
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row

    return connection


def initialize_database():
    """
    Create the activities table if it does not exist.
    Existing activity records are preserved.
    """
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS activities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                application TEXT NOT NULL,
                action TEXT NOT NULL,
                duration_seconds REAL NOT NULL
                    CHECK (duration_seconds >= 0)
            )
        """)


def save_activity(timestamp, application, action, duration_seconds):
    """
    Save one activity and return its unique database ID.
    """
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO activities (
                timestamp,
                application,
                action,
                duration_seconds
            )
            VALUES (?, ?, ?, ?)
            """,
            (timestamp, application, action, duration_seconds)
        )

        return cursor.lastrowid


def get_activities():
    """
    Retrieve all saved activities, newest first.
    """
    with get_connection() as connection:
        cursor = connection.execute(
            """
            SELECT
                id,
                timestamp,
                application,
                action,
                duration_seconds
            FROM activities
            ORDER BY timestamp DESC, id DESC
            """
        )

        return [
            dict(row)
            for row in cursor.fetchall()
        ]


def delete_activity(activity_id):
    """
    Delete one activity using its unique ID.

    Returns True if an activity was deleted.
    Returns False if the ID does not exist.
    """
    with get_connection() as connection:
        cursor = connection.execute(
            """
            DELETE FROM activities
            WHERE id = ?
            """,
            (activity_id,)
        )

        return cursor.rowcount > 0