import React, { useState, useContext } from 'react';
import { AuthContext } from './AuthContext';

function getRandomColor(name) {
  const colors = ['#F87171', '#60A5FA', '#FBBF24', '#34D399', '#A78BFA'];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export default function HeaderAuthPanel() {
  const { user, loginUser, logoutUser, registerUser } = useContext(AuthContext);
  const [showModal, setShowModal] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', email: '' });
  const [error, setError] = useState('');

  const toggleModal = () => setShowModal(!showModal);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    let success = false;
    if (isRegister) {
      success = await registerUser(form.username, form.email, form.password);
    } else {
      success = await loginUser(form.username, form.password);
    }
    if (success) {
      setShowModal(false);
      setForm({ username: '', password: '', email: '' });
      setError('');
    } else {
      setError('Authentication failed. Check credentials.');
    }
  };

  const profileIcon = !user ? (
    <div style={{
      width: 40,
      height: 40,
      borderRadius: '50%',
      backgroundColor: '#ffffff',
      textAlign: 'center',
      lineHeight: '40px',
      fontWeight: 'bold',
      fontSize: 20,
      userSelect: 'none',
      transition: 'background-color 0.3s ease',
      cursor: 'default',
    }}>?</div>
  ) : (
    <div style={{
      width: 40,
      height: 40,
      borderRadius: '50%',
      backgroundColor: getRandomColor(user.username),
      color: 'white',
      textAlign: 'center',
      lineHeight: '40px',
      fontWeight: 'bold',
      fontSize: 20,
      userSelect: 'none',
      transition: 'background-color 0.3s ease',
      cursor: 'default',
    }}>
      {user.username.charAt(0).toUpperCase()}
    </div>
  );

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 15, fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
        {profileIcon}
        {user ? (
          <>
            <div style={{ fontWeight: '600', fontSize: '1rem' }}>Hi, {user.username}</div>
            <button
              onClick={logoutUser}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ef4444',
                border: 'none',
                borderRadius: 6,
                color: 'white',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dc2626'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ef4444'}
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={toggleModal}
            style={{
              padding: '0.5rem 1.25rem',
              backgroundColor: '#2563eb',
              border: 'none',
              borderRadius: 0,
              color: 'white',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2563eb'}
          >
            Login
          </button>
        )}
      </div>

      {showModal && (
        <>
          {/* Modal Backdrop */}
          <div
            onClick={toggleModal}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.35)',
              zIndex: 999,
              backdropFilter: 'blur(3px)',
              cursor: 'pointer',
            }}
          />
          {/* Modal Panel */}
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '320px',
            height: '100%',
            backgroundColor: '#fff',
            boxShadow: '-4px 0 12px rgba(0,0,0,0.15)',
            padding: '2rem',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
          }}>
            <div>
              <h2 style={{ marginBottom: '1.5rem', fontWeight: '700', fontSize: '1.5rem', color: '#111827' }}>
                {isRegister ? 'Sign Up' : 'Login'}
              </h2>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <input
                  name="username"
                  placeholder="Username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  style={{
                    padding: '0.6rem 0.75rem',
                    borderRadius: 6,
                    border: '1.5px solid #d1d5db',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#d1d5db'}
                />
                {isRegister && (
                  <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    style={{
                      padding: '0.6rem 0.75rem',
                      borderRadius: 6,
                      border: '1.5px solid #d1d5db',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'border-color 0.2s ease',
                    }}
                    onFocus={e => e.target.style.borderColor = '#2563eb'}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'}
                  />
                )}
                <input
                  name="password"
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  style={{
                    padding: '0.6rem 0.75rem',
                    borderRadius: 6,
                    border: '1.5px solid #d1d5db',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#d1d5db'}
                />
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#2563eb',
                    color: 'white',
                    padding: '0.65rem',
                    border: 'none',
                    borderRadius: 6,
                    fontWeight: '700',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2563eb'}
                >
                  {isRegister ? 'Register' : 'Login'}
                </button>
                {error && <div style={{ color: '#dc2626', fontWeight: '600', marginTop: '-0.5rem' }}>{error}</div>}
              </form>
            </div>

            <div>
              <button
                onClick={() => setIsRegister(!isRegister)}
                style={{
                  marginTop: '1.5rem',
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '0.95rem',
                }}
              >
                {isRegister ? 'Already have an account? Login' : "Don't have an account? Sign up"}
              </button>
              <button
                onClick={toggleModal}
                style={{
                  marginTop: '1rem',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  padding: '0.45rem',
                  border: 'none',
                  borderRadius: 6,
                  width: '100%',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dc2626'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ef4444'}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
