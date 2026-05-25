import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import all yer Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import RepoDashboard from './pages/RepoDashboard';
import Agents from './pages/Agents';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import NewRepo from './pages/NewRepo';

import Notifications from './pages/Notifications';
import Watchdog from './pages/Watchdog';
import WatchdogSettings from './pages/WatchdogSettings';

import { AgentProvider } from './context/AgentContext';

function App() {
  return (
    <AgentProvider>
      {/* We add future flags here to suppress those React Router v7 warnings ye saw in the console */}
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Core App Routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/repo/:id" element={<RepoDashboard />} />
          <Route path="/repo/new" element={<NewRepo />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />

          {/* Newly Added Missing Routes */}
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/watchdog" element={<Watchdog />} />
          <Route path="/watchdog/settings" element={<WatchdogSettings />} />
        </Routes>
      </Router>
    </AgentProvider>
  );
}

export default App;