// src/pages/Login.js
// Login Component
// This component handles user authentication
// It provides a form for users to log in with their email and password

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import axios from "axios";
import "../styles/theme.css";

// Base URL for API calls from environment variables
const API_BASE = process.env.REACT_APP_API_BASE;
console.log("🔍 API_BASE:", API_BASE);

function Login() {
  // State for form inputs and loading
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Get login function from user context and navigation
  const { login } = useUser();
  const navigate = useNavigate();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate form inputs
    if (!email || !password) {
      setError("נא למלא את כל השדות");
      return;
    }

    try {
      setIsLoading(true);
      
      // Send login request to server
      const response = await axios.post(`${API_BASE}/login`, {
        email,
        password
      });

      // Update user context and redirect on success
      login(response.data.user);
      navigate("/home");
    } catch (err) {
      console.error("❌ שגיאה בהתחברות:", err);
      setError(err.response?.data?.message || "שגיאה בשרת");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card card elevation-2">
        {/* App logo */}
        <div className="login-header">
          <span className="material-icons" style={{ fontSize: '48px', color: 'var(--primary)' }}>
            auto_stories
          </span>
          <h1>BookIt</h1>
        </div>

        {/* Error message */}
        {error && (
          <div className="error">
            <span className="material-icons">error</span>
            {error}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} dir="rtl">
          {/* Email input */}
          <div className="input-group">
            <span className="material-icons input-icon">email</span>
            <input
              type="email"
              className="input-field"
              placeholder="אימייל"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Password input */}
          <div className="input-group">
            <span className="material-icons input-icon">lock</span>
            <input
              type="password"
              className="input-field"
              placeholder="סיסמה"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Submit button */}
          <button 
            type="submit" 
            className="button button-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="button-loading">
                <span className="material-icons spinning">refresh</span>
                טוען...
              </div>
            ) : (
              <>
                <span className="material-icons">login</span>
                התחבר
              </>
            )}
          </button>
        </form>

        {/* Registration link */}
        <p className="register-link">
          עדיין אין לך משתמש? <Link to="/register">הירשם</Link>
        </p>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
          padding: var(--spacing-md);
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          padding: var(--spacing-xl);
          background: var(--background);
          text-align: center;
        }

        .login-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-xl);
        }

        .login-header h1 {
          margin: 0;
          color: var(--primary);
        }

        .input-group {
          position: relative;
          margin-bottom: var(--spacing-md);
        }

        .input-icon {
          position: absolute;
          right: var(--spacing-md);
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary);
        }

        .input-field {
          padding-right: calc(var(--spacing-xl) + var(--spacing-md));
        }

        .button {
          width: 100%;
          margin-top: var(--spacing-lg);
        }

        .button-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        .register-link {
          margin-top: var(--spacing-xl);
          color: var(--text-secondary);
        }

        .register-link a {
          color: var(--primary);
          text-decoration: none;
          font-weight: 500;
          transition: color var(--transition-fast);
        }

        .register-link a:hover {
          color: var(--primary-dark);
        }

        @media (max-width: 480px) {
          .login-card {
            padding: var(--spacing-lg);
          }
        }
      `}</style>
    </div>
  );
}

export default Login;
