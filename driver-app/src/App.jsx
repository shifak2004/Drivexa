import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import IncomingRides from './pages/IncomingRides';
import ActiveRide from './pages/ActiveRide';
import RideHistory from './pages/RideHistory';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <div className="app">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <Dashboard />
                  </>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/incoming"
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <IncomingRides />
                  </>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/ride/:id"
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <ActiveRide />
                  </>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <RideHistory />
                  </>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
