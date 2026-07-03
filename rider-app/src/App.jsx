import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Landing from './pages/Landing';
import Home from './pages/Home';
import RideHistory from './pages/RideHistory';
import RideTracking from './pages/RideTracking';
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
              path="/book"
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <Home />
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
            
            <Route
              path="/ride/:id"
              element={
                <ProtectedRoute>
                  <>
                    <Navbar />
                    <RideTracking />
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
