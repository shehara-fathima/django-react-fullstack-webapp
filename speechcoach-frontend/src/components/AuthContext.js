import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [authTokens, setAuthTokens] = useState(() =>
    localStorage.getItem('tokens') ? JSON.parse(localStorage.getItem('tokens')) : null
  );
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (authTokens) {
      fetch('http://localhost:8000/api/current_user/', {
        headers: {
          Authorization: `Bearer ${authTokens.access}`,
        },
      })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => setUser(data))
        .catch(() => setUser(null));
    } else {
      setUser(null);
    }
  }, [authTokens]);

  const loginUser = async (username, password) => {
    const res = await fetch('http://localhost:8000/api/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      const data = await res.json();
      setAuthTokens(data);
      localStorage.setItem('tokens', JSON.stringify(data));
      return true;
    }

    return false;
  };

  const logoutUser = () => {
    setAuthTokens(null);
    setUser(null);
    localStorage.removeItem('tokens');
    window.location.href = '/';
  };

  const registerUser = async (username, email, password) => {
    const res = await fetch('http://localhost:8000/api/register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    return res.ok;
  };

  return (
    <AuthContext.Provider
      value={{ user, authTokens, loginUser, logoutUser, registerUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
