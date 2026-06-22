import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

import Login from './pages/login';
import Register from './pages/register';
import Dashboard from './pages/Dashboard';
import TripPlannerForm from './components/TripPlannerForm';
import Chatbot from "./components/Chatbot";
import FloatingChat from "./components/FloatingChat"; // ✅ Import here

export default function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      {/* ✅ Render Floating Chat globally (only if user is logged in) */}
      {user && <FloatingChat userId={user.uid} />}

      <Routes>
        {/* Default route */}
        <Route path="/" element={<Navigate to="/plan" />} />

        {/* Trip Planner - protected */}
        <Route
          path="/plan"
          element={user ? <TripPlannerForm /> : <Navigate to="/login" />}
        />

        {/* Login / Register */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Chatbot route (optional standalone page) */}
        <Route
          path="/chatbot"
          element={user ? <Chatbot /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}
