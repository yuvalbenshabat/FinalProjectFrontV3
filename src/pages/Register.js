import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios"; // ← הוספנו

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCities = async () => {
      if (city.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await fetch(
          `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${city}&countryIds=IL&limit=5&languageCode=he`,
          {
            method: "GET",
            headers: {
              "X-RapidAPI-Key": "demo", // שים API Key אמיתי
              "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com"
            }
          }
        );

        const data = await response.json();
        const results = data.data.map((item) => item.city);
        setSuggestions(results);
      } catch (error) {
        console.error("שגיאה בטעינת ערים:", error);
        setSuggestions([]);
      }
    };

    fetchCities();
  }, [city]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password || !username || !city || !phone) {
      alert("נא למלא את כל השדות כולל עיר וטלפון");
      return;
    }

    try {
      const response = await axios.post("http://localhost:3001/register", {
        email,
        password,
        username,
        phone,
        city
      });

      alert("נרשמת בהצלחה!");
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "שגיאה בהרשמה");
      console.error("שגיאת שרת:", err);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.logo}>📚 הרשמה ל־BookIt</h1>
        <form onSubmit={handleSubmit} dir="rtl">
          <input
            type="text"
            placeholder="שם מלא "
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />
          <input
            type="email"
            placeholder="אימייל"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          <input
            type="tel"
            placeholder="מספר טלפון"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={styles.input}
          />
          <input
            type="text"
            placeholder="הקלד עיר"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={styles.input}
            list="city-list"
          />
          <datalist id="city-list">
            {suggestions.map((c, index) => (
              <option key={index} value={c} />
            ))}
          </datalist>

          <button type="submit" style={styles.button}>הירשם</button>
        </form>
        <p style={styles.login}>
          כבר יש לך משתמש? <Link to="/">התחבר</Link>
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
    alignItems: "center"
  },
  card: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "10px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
    width: "300px",
    textAlign: "center"
  },
  logo: {
    marginBottom: "30px",
    color: "#333",
    direction: "rtl"
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "15px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    textAlign: "right"
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
  login: {
    marginTop: "20px",
    fontSize: "0.9rem",
    direction: "rtl"
  }
};

export default Register;
