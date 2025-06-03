import psycopg2
from psycopg2.extras import RealDictCursor
from django.conf import settings
import json

def get_conn():
    return psycopg2.connect(
        dbname=settings.DATABASES['default']['NAME'],
        user=settings.DATABASES['default']['USER'],
        password=settings.DATABASES['default']['PASSWORD'],
        host=settings.DATABASES['default']['HOST'],
        port=settings.DATABASES['default']['PORT']
    )

def insert_speech_session(user_id, transcription, analysis, context):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO speech_sessions (user_id, transcription, analysis, context) VALUES (%s, %s, %s, %s)",
                (user_id, transcription, analysis, json.dumps(context))
            )
            conn.commit()
    finally:
        conn.close()

def get_user_sessions(user_id):
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT id, transcription, analysis, context, created_at FROM speech_sessions WHERE user_id = %s ORDER BY created_at DESC",
                (user_id,)
            )
            return cur.fetchall()
    finally:
        conn.close()

# User profile helpers (optional, for profile feature)
def get_user_profile(user_id):
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM user_profiles WHERE user_id = %s", (user_id,))
            return cur.fetchone()
    finally:
        conn.close()

def update_user_profile(user_id, bio=None, avatar_url=None):
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO user_profiles (user_id, bio, avatar_url)
                VALUES (%s, %s, %s)
                ON CONFLICT (user_id) DO UPDATE SET
                    bio = EXCLUDED.bio,
                    avatar_url = EXCLUDED.avatar_url
            """, (user_id, bio, avatar_url))
            conn.commit()
    finally:
        conn.close()
