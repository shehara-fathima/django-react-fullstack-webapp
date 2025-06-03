import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export default function CommunicationImprovements() {
  const { authTokens } = useContext(AuthContext);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchScores = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.post('http://localhost:8000/api/improvements/',{}, {
          headers: { Authorization: `Bearer ${authTokens.access}` }
        });
        setScores(res.data.scores);
      } catch {
        setError('Could not load scores.');
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
  }, [authTokens]);

  const renderScoreBars = () => {
    if (!scores || Object.keys(scores).length === 0) return null;

    return Object.entries(scores).map(([category, value]) => (
      <div key={category} style={{ marginBottom: '0.75rem' }}>
        <strong>{category.charAt(0).toUpperCase() + category.slice(1)}:</strong>
        <div style={{
          background: '#fde68a',
          height: '1rem',
          borderRadius: '0.25rem',
          overflow: 'hidden',
          marginTop: '0.25rem',
          width: '100%',
          maxWidth: '400px'
        }}>
          <div style={{
            width: `${(value / 5) * 100}%`,
            background: '#f59e0b',
            height: '100%',
            transition: 'width 0.5s ease'
          }} />
        </div>
      </div>
    ));
  };

  return (
    <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '6px', maxWidth: '600px' }}>
      <h2 style={{ color: '#92400e', marginBottom: '1rem' }}>📊 Scores</h2>

      {loading ? (
        <p>Loading scores...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        renderScoreBars()
      )}
    </div>
  );
}
