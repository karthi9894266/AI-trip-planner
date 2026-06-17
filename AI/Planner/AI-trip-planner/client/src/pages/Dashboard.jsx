import React, { useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const { user, login, loading } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get('token');

    if (urlToken && !user) {
      // Step 1: Log in with token
      login(urlToken)
        .then(() => {
          // Step 2: Redirect to main module
          navigate('/plan', { replace: true });
        })
        .catch(() => {
          // If login fails, go to login page
          navigate('/login', { replace: true });
        });
    } else if (user) {
      // Already logged in, go to main module
      navigate('/plan', { replace: true });
    } else if (!urlToken && !user) {
      // No token and not logged in, redirect to login
      navigate('/login', { replace: true });
    }
  }, [location.search, login, user, navigate]);

  // Show loading while processing login
  if (loading || !user) return <div>Loading...</div>;

  return null; // No flash screen
};

export default Dashboard;
