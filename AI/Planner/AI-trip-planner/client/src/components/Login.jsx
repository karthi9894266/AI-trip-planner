import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("https://ai-trip-planner-backend-4ga2.onrender.com/api/auth/user", {
      withCredentials: true,
    })
    .then(res => {
      if (res.data) {
        navigate("/dashboard");
      }
    })
    .catch(() => {});
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("https://ai-trip-planner-backend-4ga2.onrender.com/api/auth/login", {
        email,
        password
      });

      const { token } = res.data;

      if (token) {
        localStorage.setItem("token", token); // ✅ Save token to localStorage
        navigate("/dashboard"); // ✅ Redirect to dashboard
      } else {
        setError("Login failed. No token returned.");
      }
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      setError("Invalid email or password.");
    }
  };

  return (
    <div className="auth-form">
      <h2>Login to AI Trip Planner</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}
      </form>

      {/* Google Login */}
      <div style={{ marginTop: "2rem" }}>
        <a href="https://ai-trip-planner-backend-4ga2.onrender.com/api/auth/google">
          <button
            type="button"
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              backgroundColor: "#4285F4",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Sign in with Google
          </button>
        </a>
      </div>
    </div>
  );
}

export default Login;
