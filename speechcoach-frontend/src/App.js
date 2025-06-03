import React from 'react';
import { AuthProvider } from './components/AuthContext';
import TranscribeAndAnalyze from './components/TranscribeAndAnalyze';

function App() {
  return (
    <AuthProvider>
      <TranscribeAndAnalyze />
    </AuthProvider>
  );
}

export default App;
