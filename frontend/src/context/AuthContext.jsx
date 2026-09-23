import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // sessionStorage (not localStorage) is deliberate: the token is cleared
    // automatically when the browser/tab closes, so reopening the site
    // always starts at the login screen instead of silently staying signed
    // in as whoever last used it - important on a shared/demo machine.
    const token = sessionStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    // Validate the stored token against the server on load rather than
    // trusting it blindly - if it's expired/invalid, this clears it.
    getCurrentUser()
      .then(({ user }) => setUser(user))
      .catch(() => sessionStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  function loginSuccess({ token, user }) {
    sessionStorage.setItem('token', token);
    setUser(user);
  }

  function logout() {
    sessionStorage.removeItem('token');
    setUser(null);
  }

  // Called after a profile edit succeeds, so the name shown in the top nav
  // etc. updates immediately without a full page reload.
  function updateUser(updatedUser) {
    setUser(updatedUser);
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginSuccess, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
