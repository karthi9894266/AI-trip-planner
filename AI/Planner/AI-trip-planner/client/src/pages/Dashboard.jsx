import React, { useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const { user, login, loading } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
  if (loading) return;

  const params = new URLSearchParams(location.search);
  const urlToken = params.get('token');

  console.log("Dashboard loading:", loading);
  console.log("Dashboard user:", user);
  console.log("Dashboard token:", urlToken);

  if (urlToken && !user) {
    login(urlToken)
      .then(() => {
        navigate('/plan', { replace: true });
      })
      .catch(() => {
        navigate('/login', { replace: true });
      });
  } else if (user) {
    navigate('/plan', { replace: true });
  } else {
    navigate('/login', { replace: true });
  }
}, [loading, location.search, login, user, navigate]);
  

  // Show loading while processing login
  if (loading || !user) return <div>Loading...</div>;

  return null; // No flash screen
};

export default Dashboard;
