import React, { useContext, useEffect, useState } from 'react';
import { Upload, Settings, BarChart, Sparkles } from 'lucide-react';
import '../App.css';
import Lottie from 'lottie-react';
import sparkleAnimation from '../animations/sparkle.json';
import MicRecorder from 'mic-recorder-to-mp3';
import { AuthContext } from './AuthContext'; // Make sure you have this context implemented and wrapping your app
import HeaderAuthPanel from './HeaderAuthPanel';
import CommunicationImprovements from './CommunicationImprovements';
import GeminiSuggestions from './GeminiSuggestions'; // adjust the path as needed



const recorder = new MicRecorder({ bitRate: 128 });

// Utility: get random bg color for profile icon
function getRandomColor(name) {
  const colors = ['#F87171', '#60A5FA', '#FBBF24', '#34D399', '#A78BFA'];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export default function TranscribeAndAnalyze() {
  const { user, authTokens, loginUser, logoutUser } = useContext(AuthContext);

  const [audio, setAudio] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [listener, setListener] = useState('');
  const [situation, setSituation] = useState('');
  const [speakerTrait, setSpeakerTrait] = useState('');
  const [topicPriority, setTopicPriority] = useState('');
  const [feedbackType, setFeedbackType] = useState('');
  const [feedbackGoal, setFeedbackGoal] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingAvailable, setIsRecordingAvailable] = useState(false);
  const [sessions, setSessions] = useState([]);

  // Handle audio file upload
  const handleFileChange = e => setAudio(e.target.files[0]);

  // Start recording
  const startRecording = () => {
    recorder.start().then(() => setIsRecording(true)).catch(console.error);
  };

  // Stop recording and get audio file
  const stopRecording = () => {
    recorder.stop().getMp3().then(([buffer, blob]) => {
      const file = new File(buffer, 'recording.mp3', { type: blob.type });
      setAudio(file);
      setIsRecording(false);
      setIsRecordingAvailable(true);
    }).catch(console.error);
  };

  // Transcribe audio
  const handleTranscribe = async () => {
    if (!audio) return;
    const formData = new FormData();
    formData.append('file', audio);
    try {
      const res = await fetch('http://localhost:8000/api/transcribe/', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setTranscription(data.transcription);
    } catch {
      setTranscription('Transcription failed.');
    }
  };

  // Analyze transcription, save if logged in
  const handleAnalyze = async () => {
    const context = {
      listener,
      situation,
      speaker_trait: speakerTrait,
      topic_priority: topicPriority,
    };
    const saveFlag = user ? "true" : "false";

    try {
      const res = await fetch('http://localhost:8000/api/analyze/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authTokens ? { Authorization: `Bearer ${authTokens.access}` } : {}),
        },
        body: JSON.stringify({
          text: transcription,
          feedback_type: feedbackType,
          feedback_goal: feedbackGoal,
          context,
          save: saveFlag,
        }),
      });
      const data = await res.json();
      setAnalysis(`${data.analysis}\n\n(Source: ${data.source || 'gemini'})`);
      if (user) {
        // Refresh sessions after saving analysis
        fetchSessions();
      }
    } catch {
      setAnalysis('Analysis failed.');
    }
  };

  // Fetch user's saved sessions
  const fetchSessions = () => {
    if (authTokens && user) {
      fetch('http://localhost:8000/api/sessions/', {
        headers: { Authorization: `Bearer ${authTokens.access}` },
      })
        .then(res => res.json())
        .then(data => setSessions(data))
        .catch(() => setSessions([]));
    } else {
      setSessions([]);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [authTokens, user]);

  // Profile icon component
  const ProfileIcon = () => {
    if (!user) return (
      <div style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        backgroundColor: '#ccc',
        textAlign: 'center',
        lineHeight: '40px',
        fontWeight: 'bold',
        userSelect: 'none',
      }}>?</div>
    );
    const bgColor = getRandomColor(user.username);
    return (
      <div style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        backgroundColor: bgColor,
        color: 'white',
        textAlign: 'center',
        lineHeight: '40px',
        fontWeight: 'bold',
        userSelect: 'none',
      }}>
        {user.username.charAt(0).toUpperCase()}
      </div>
    );
  };

  // Login form component
  const LoginForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    const submit = async e => {
      e.preventDefault();
      const success = await loginUser(username, password);
      if (!success) setError("Login failed. Check credentials.");
      else setError(null);
    };

    return (
      <form onSubmit={submit} style={{ marginBottom: '1rem' }}>
        <input
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        {error && <div style={{ color: 'red' }}>{error}</div>}
      </form>
    );
  };

  // Logout button component
  const LogoutButton = () => <button onClick={logoutUser}>Logout</button>;

  return (
    <div style={{ minHeight: '100vh', background: '#e5e8e8', fontFamily: 'Segoe UI, sans-serif', padding: '1rem', color: '#1f2937' }}>
      <header style={{ 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'space-between', 
  marginBottom: '1rem',
  padding: '0 1rem'
}}>
  <HeaderAuthPanel />

  {/* CENTER: Title + Sparkle */}
  <div style={{ textAlign: 'center', flexGrow: 1 }}>
    <h1 style={{
      fontSize: '3.5rem',
      color: '#0047AB',
      fontWeight: '700',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '2.5rem',
      marginBottom: '0.5rem'
    }}>
      <Sparkles size={50} fill="gold" stroke="gold" /> MoinsLy
      <div style={{ width: 100, height: 100, marginLeft: '0.01rem' }}>
        <Lottie animationData={sparkleAnimation} loop />
      </div>
    </h1>
    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', fontStyle: 'italic', color: '#4b5563', marginTop: '0' }}>
      Balance your Talk. Own your Space
    </p>
  </div>

  {/* RIGHT: Optional space or empty */}
  <div style={{ width: 100 }}></div> {/* Keeps header balanced */}
</header>


      <div style={{ display: 'flex', gap: '1.5rem' }}>
        {/* LEFT MAIN CONTAINER (3) */}
        <div style={{ flex: 2,  display: 'flex', flexDirection: 'column', gap: '0rem', background: '#fdedec' }}>
          {/* Upload & Record */}
          <div style={{ flex: 1, display: 'flex',marginTop :'2rem', alignItems: 'center', justifyContent: 'space-evenly', padding: '1rem', borderRadius: '0px' }}>
            <label htmlFor="upload-audio" style={{ backgroundColor: 'rgba(221, 131, 239, 0.9)', color: 'white', padding: '0.6rem 1rem', borderRadius: '0px', fontWeight: 'bold', cursor: 'pointer' }}>
              💿 Upload Audio
              <input id="upload-audio" type="file" accept="audio/*" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
            <span style={{ fontWeight: 'bold', color: '#334155' }}>OR</span>
            <div
              role="button"
              tabIndex={0}
              onClick={isRecording ? stopRecording : startRecording}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (isRecording ? stopRecording() : startRecording())}
              style={{
                backgroundColor: isRecording ? '#dc2626' : 'rgba(251, 144, 59, 0.9)',
                color: 'white',
                padding: '0.6rem 1rem',
                borderRadius: '0px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}>
              {isRecording ? '⏹️ Stop Recording' : '🎙️ Start Recording'}
            </div>
          </div>

          {/* Audio Preview & Transcribe */}
          <div style={{ flex: 1, borderRadius: '0px', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ fontStyle: 'italic', color: '#64748b', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {audio ? <audio controls src={URL.createObjectURL(audio)} /> : "Audio preview will appear here after uploading or recording."}
            </div>
            <button onClick={handleTranscribe} disabled={!audio} style={{ marginTop: '1rem', backgroundColor: 'rgba(0, 0, 0, 0.75)', color: 'white', padding: '0.6rem', borderRadius: '0px', border: 'none', fontWeight: 'bold' }}>
              <Upload size={16} style={{ marginRight: '0.5rem' }} />Transcribe
            </button>
          </div>

          {/* Transcription */}
          <div style={{ flex: 2, borderRadius: '0px', padding: '1rem' }}>
            <h2>📝 Transcription </h2>
            <div style={{ whiteSpace: 'pre-wrap', color: '#334155' }}>{transcription || 'Preview will appear here after processing.'}</div>
          </div>
          {/* SESSIONS HISTORY */}
          {user && (
  <section style={{ marginTop: '1rem', padding: '1rem', borderRadius: '0px' }}>
    <h2>Your Sessions</h2>
    <div style={{ maxHeight: '700px', overflowY: 'auto' }}>
      {sessions.length === 0 ? (
        <p>No saved sessions yet.</p>
      ) : (
        sessions.map(s => (
          <div key={s.id} style={{ background: '#f3f4f6', border: '1px solid #ccc', padding: '0.5rem', margin: '0.5rem 0' }}>
            <div><strong>Date:</strong> {new Date(s.created_at).toLocaleString()}</div>
            <div><strong>Transcription:</strong> {s.transcription}</div>
            <div><strong>Analysis:</strong> {s.analysis}</div>
            <div><strong>Context:</strong> {JSON.stringify(s.context)}</div>
          </div>
        ))
      )}
    </div>
  </section>
)}

          


        </div>

        {/* RIGHT MAIN CONTAINER (10) */}
        <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* SETTINGS CONTAINER */}
          <div style={{ flex: 1, maxHeight: '200px', background: '#ebdef0', borderRadius: '0px', padding: '1rem', display: 'flex', gap: '1rem' }}>
            {/* LEFT (2): Main Inputs */}
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#4c1d95' }}>
                <Settings size={20} /> Context
              </h2><small style={{ color: '#6b7280' }}>Set the scene for better feedback</small>
              <input
                placeholder="Who are you speaking to?"
                value={listener}
                onChange={e => setListener(e.target.value)}
              />
              <input
                placeholder="What's the situation or occasion?"
                value={situation}
                onChange={e => setSituation(e.target.value)}
              />
              <input
                placeholder="Describe your communication style"
                value={speakerTrait}
                onChange={e => setSpeakerTrait(e.target.value)}
              />
              <input
                placeholder="How important is the conversation to you?"
                value={topicPriority}
                onChange={e => setTopicPriority(e.target.value)}
              />

            </div>

            {/* RIGHT (1): Advanced */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '4.5rem' }}>
              <strong style={{ color: '#6d28d9' }}>Advanced</strong>
              <select value={feedbackType} onChange={e => setFeedbackType(e.target.value)}>
                <option value="">Feedback Type</option>
                <option value="concise">Concise</option>
                <option value="in-depth">In-depth</option>
                <option value="suggestions">Suggestions</option>
              </select>
              <select value={feedbackGoal} onChange={e => setFeedbackGoal(e.target.value)}>
                <option value="">Feedback Goal</option>
                <option value="pacing">Pacing</option>
                <option value="clarity">Clarity</option>
                <option value="emotion">Emotion</option>
                <option value="brevity">Brevity</option>
              </select>
              <button
                onClick={handleAnalyze}
                disabled={!transcription}
                style={{ backgroundColor: 'rgba(22, 163, 74, 0.8)', color: 'white', padding: '0.5rem', borderRadius: '0px', fontWeight: 'bold' }}
              >
                Analyze
              </button>
            </div>
          </div>

          {/* ANALYSIS */}
          <div style={{ flex: 2, overflowY: 'auto',maxHeight: '200px', background: '#d5f5e3', borderRadius: '0px', padding: '1rem' }}>
            <h2><BarChart size={20} /> Analysis</h2>
            <small style={{ color: '#065f46' }}></small>
            <div style={{ whiteSpace: 'pre-wrap', marginTop: '1rem', color: '#064e3b' }}>{analysis || 'Personalized feedback based on your context will appear here after processing.'}</div>
          </div>
          
                    {/* COMMUNICATION IMPROVEMENTS & GEMINI SUGGESTIONS side by side */}
{user && (
  <div style={{ marginTop: '.25rem', display: 'flex', gap: '2rem' }}>
    <GeminiSuggestions />
    <CommunicationImprovements />
  </div>
)}


        </div>
      </div>
    </div>
  );
}
