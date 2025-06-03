from django.urls import path
from .views import (
    TranscribeAudio,
    analyze_text,
    RegisterUserView,
    current_user,
    user_sessions,
    profile_view,
    profile_update,
    generate_improvements,
    get_improvements,
)

urlpatterns = [
    path('transcribe/', TranscribeAudio.as_view(), name='transcribe'),
    path('analyze/', analyze_text, name='analyze-text'),
    path('register/', RegisterUserView.as_view(), name='register'),
    path('current_user/', current_user, name='current-user'),
    path('sessions/', user_sessions, name='user-sessions'),
    path('profile/', profile_view, name='profile'),
    path('profile/update/', profile_update, name='profile-update'),
    path('improvements/', get_improvements, name='get-improvements'),
    path('improvements/generate/', generate_improvements, name='generate-improvements'),
]
