import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "program_data_clean.db")
JSON_PATH = os.path.join(os.path.dirname(__file__), "program_data_clean.json")


def get_connection():
    return sqlite3.connect(DB_PATH)


def list_tables():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = cursor.fetchall()
    conn.close()
    return [t[0] for t in tables]


def query_table(table_name, limit=10):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(f'SELECT * FROM "{table_name}" LIMIT {limit}')
        rows = cursor.fetchall()
        cursor.execute(f'PRAGMA table_info("{table_name}")')
        cols = [row[1] for row in cursor.fetchall()]
        conn.close()
        return cols, rows
    except Exception as e:
        conn.close()
        return None, str(e)


def load_json():
    with open(JSON_PATH) as f:
        return json.load(f)
