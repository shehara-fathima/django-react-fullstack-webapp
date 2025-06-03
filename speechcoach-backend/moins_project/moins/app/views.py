import os
import whisper
import warnings
import google.generativeai as genai
import logging
import json

from dotenv import load_dotenv
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework import status, generics, permissions
from django.db import connection
from django.contrib.auth.models import User
from rest_framework.serializers import ModelSerializer
from rest_framework.permissions import IsAuthenticated

from .llm_fallback import local_analyze_speech
from .db import insert_speech_session, get_user_sessions, get_user_profile, update_user_profile
from .helpers import generate_improvement_prompt

# --- Config ---
warnings.filterwarnings("ignore", message="FP16 is not supported on CPU; using FP32 instead")
load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=api_key)

# Load Whisper ASR model once
asr_model = whisper.load_model("base")

# 🎤 Transcription View
class TranscribeAudio(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        audio_file = request.FILES.get('file')
        if not audio_file:
            return Response({"error": "No audio file provided"}, status=status.HTTP_400_BAD_REQUEST)

        temp_path = "temp_audio.wav"
        with open(temp_path, "wb") as f:
            for chunk in audio_file.chunks():
                f.write(chunk)

        try:
            result = asr_model.transcribe(temp_path)
            return Response({"transcription": result["text"]})
        except Exception as e:
            return Response({"error": str(e)}, status=500)
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

# 🤖 Analyze Text via Gemini
@api_view(['POST'])
def analyze_text(request):
    text = request.data.get("text")
    context = request.data.get("context", {})
    feedback_type = request.data.get('feedback_type', '').strip()
    feedback_goal = request.data.get('feedback_goal', '').strip()

    if not text:
        return Response({"error": "No text provided"}, status=400)

    speaker_trait = context.get('speaker_trait', 'N/A')
    listener = context.get('listener', 'N/A')
    situation = context.get('situation', 'N/A')
    topic_priority = context.get('topic_priority', 'N/A')

    prompt = f"""
    You are a communication coach. Evaluate the following speech based on the provided context.

    - Speaker Traits: {speaker_trait}
    - Listener Type: {listener}
    - Situation: {situation}
    - Priority Topics: {topic_priority}
    """

    if feedback_type:
        prompt += f"Give {feedback_type.lower()} feedback.\n"
    if feedback_goal:
        prompt += f"Focus especially on {feedback_goal.lower()}.\n"

    prompt += "Keep the response helpful and clear."

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        analysis = response.text
        source = "gemini"
    except Exception as e:
        logging.warning(f"Gemini API failed: {e}. Using local model.")
        analysis = local_analyze_speech(text, context)
        source = "local_llm"

    if request.user.is_authenticated and request.data.get("save", "false") == "true":
        insert_speech_session(request.user.id, text, analysis, context)

    return Response({
        "analysis": analysis,
        "source": source
    })

# 🧠 Save User Improvements (raw PostgreSQL)
def save_user_improvement(user_id, summary, scores):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO user_improvements (user_id, summary, scores, created_at)
            VALUES (%s, %s, %s, NOW())
            """,
            [user_id, summary, json.dumps(scores)]
        )

# 🚀 Generate Improvements from last 5 sessions
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_improvements(request):
    user_id = request.user.id

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT transcription FROM speech_sessions
            WHERE user_id = %s ORDER BY created_at DESC
            """,
            [user_id]
        )
        rows = cursor.fetchall()

    sessions = [{"transcription": r[0]} for r in rows]
    if not sessions:
        return Response({"error": "Not enough data to analyze"}, status=400)

    prompt = generate_improvement_prompt(sessions)

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        summary = response.text
        scores = {"clarity": 4.1, "emotion": 3.9, "pacing": 4.3, "structure": 4.0}
    except Exception as e:
        logging.warning(f"LLM failed: {e}")
        summary = "Not enough data or model unavailable."
        scores = {"clarity": 0, "emotion": 0, "pacing": 0, "structure": 0}

    save_user_improvement(user_id, summary, scores)

    return Response({"summary": summary, "scores": scores})

# 📈 Get Latest Improvement Summary (for frontend)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_improvements(request):
    user_id = request.user.id
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT summary, scores, created_at FROM user_improvements
            WHERE user_id = %s ORDER BY created_at DESC
            """,
            [user_id]
        )
        row = cursor.fetchone()

    if not row:
        return Response({"message": "No improvement data yet"}, status=404)

    summary, scores_json, created_at = row
    scores = json.loads(scores_json)

    clarity = scores.get("clarity", 0)
    emotion = scores.get("emotion", 0)
    pacing = scores.get("pacing", 0)
    overall = round((clarity + emotion + pacing) / 3, 2)

    return Response({
        "summary": summary,
        "scores": {
            "clarity": clarity,
            "emotion": emotion,
            "pacing": pacing,
            "overall": overall
        },
        "created_at": created_at
    })

# 👤 User Sessions
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_sessions(request):
    sessions = get_user_sessions(request.user.id)
    return Response(sessions)

# 🔧 User Profile Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    profile = get_user_profile(request.user.id)
    return Response(profile or {"bio": "", "avatar_url": ""})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def profile_update(request):
    update_user_profile(
        request.user.id,
        request.data.get('bio'),
        request.data.get('avatar_url')
    )
    return Response({"message": "Profile updated"}, status=status.HTTP_200_OK)

# 👥 Auth - Register & Current User Info
class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email')

class RegisterUserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ('username', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

class RegisterUserView(generics.CreateAPIView):
    serializer_class = RegisterUserSerializer
    permission_classes = [permissions.AllowAny]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)
