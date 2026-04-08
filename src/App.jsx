import React, { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', color: 'var(--text-muted)' }}>
        Loading NexChat...
      </div>
    );
  }

  // If not logged in, show Login page.
  if (!user) {
    return <Login />;
  }

  // If logged in, wrap the Dashboard in SocketProvider
  return (
    <SocketProvider>
      <Dashboard />
    </SocketProvider>
  );
}
