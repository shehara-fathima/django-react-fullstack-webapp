import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export default function GeminiSuggestions() {
  const { authTokens } = useContext(AuthContext);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.post('http://localhost:8000/api/improvements/generate/',{}, {
          headers: { Authorization: `Bearer ${authTokens.access}` }
        });
        setSummary(res.data.summary);
      } catch {
        setError('Could not load summary.');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [authTokens]);

  return (
    <div style={{ backgroundColor: '#f0fdf4', borderRadius: '0px', padding: '1rem', color: '#065f46', fontWeight: '600' }}>
      <h2>🤖 Summary</h2>
      {loading ? (
        <p>Loading summary...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <p style={{ fontStyle: 'italic' }}>{summary || 'No summary available.'}</p>
      )}
    </div>
  );
}
