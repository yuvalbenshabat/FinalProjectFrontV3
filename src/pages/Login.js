// src/pages/Login.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import axios from "axios";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("נא למלא את כל השדות");
      return;
    }

    try {
      const response = await axios.post("http://localhost:3001/login", {
        email,
        password
      });

      login(response.data.user); // שמור את המשתמש בקונטקסט
      alert("התחברת בהצלחה!");
      navigate("/home");
    } catch (err) {
      alert(err.response?.data?.message || "שגיאה בשרת");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.logo}>📚 !BookIt</h1>

        <form onSubmit={handleSubmit} dir="rtl">
          <input
            type="email"
            placeholder="אימייל"
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="סיסמה"
            style={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" style={styles.button}>התחבר</button>
        </form>

        <p style={styles.register}>
          עדיין אין לך משתמש? <Link to="/register">הירשם</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    background: "linear-gradient(to right, #c9d6ff, #e2e2e2)",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "10px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    width: "300px",
    textAlign: "center",
  },
  logo: {
    marginBottom: "30px",
    color: "#333",
    direction: "rtl",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "15px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    textAlign: "right",
  },
  button: {
    backgroundColor: "#f6c90e",
    color: "#000",
    fontWeight: "bold",
    border: "none",
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: "pointer",
    marginTop: "10px"
  },
  register: {
    marginTop: "20px",
    fontSize: "0.9rem",
    direction: "rtl"
  }
};

export default Login;
