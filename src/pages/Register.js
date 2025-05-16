// גרסה סופית עם סינון כפילויות של ערים בהצעות
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_BASE;

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (city.length < 2) return;

    const delayDebounce = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${city}`, {
        headers: {
          'User-Agent': 'BookIt/1.0 (support@bookit.local)',
          'Accept-Language': 'he'
        }
      })
        .then(res => res.json())
        .then(data => setSuggestions(data))
        .catch(err => {
          console.error("שגיאה בשליפת ערים:", err);
          setSuggestions([]);
        });
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [city]);

  const handleSelectCity = (item) => {
    const name = item.address?.city || item.address?.town || item.address?.village || item.display_name;
    setCity(name);
    setCoordinates({ lat: item.lat, lng: item.lon });
    setSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !username || !city || !phone || !coordinates.lat) {
      alert("נא למלא את כל השדות כולל עיר וקואורדינטות");
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/register`, {
        email,
        password,
        username,
        phone,
        city,
        location: coordinates,
      });

      alert("נרשמת בהצלחה!");
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "שגיאה בהרשמה");
      console.error("שגיאת שרת:", err);
    }
  };

  const uniqueSuggestions = suggestions.reduce((acc, item) => {
    const name = item.address?.city || item.address?.town || item.address?.village || item.display_name;
    if (!acc.find(i => i.name === name)) {
      acc.push({ ...item, name });
    }
    return acc;
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.logo}>📚 הרשמה ל־BookIt</h1>
        <form onSubmit={handleSubmit} dir="rtl">
          <input type="text" placeholder="שם מלא" value={username} onChange={(e) => setUsername(e.target.value)} style={styles.input} />
          <input type="email" placeholder="אימייל" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />
          <input type="password" placeholder="סיסמה" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} />
          <input type="tel" placeholder="מספר טלפון" value={phone} onChange={(e) => setPhone(e.target.value)} style={styles.input} />

          <input
            type="text"
            placeholder="בחר עיר מתוך הרשימה"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setCoordinates({ lat: null, lng: null });
            }}
            style={styles.input}
          />

          {!coordinates.lat && city && (
            <p style={{ color: "red", fontSize: "0.8em", marginBottom: "10px" }}>
              נא לבחור עיר מתוך ההצעות בלבד
            </p>
          )}

          {uniqueSuggestions.length > 0 && (
            <ul style={styles.dropdown}>
              {uniqueSuggestions.map((item, index) => (
                <li key={index} style={styles.option} onClick={() => handleSelectCity(item)}>
                  {item.name}
                </li>
              ))}
            </ul>
          )}

          <button type="submit" style={styles.button}>הירשם</button>
        </form>
        <p style={styles.login}>כבר יש לך משתמש? <Link to="/">התחבר</Link></p>
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
  },
  dropdown: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    border: "1px solid #ccc",
    backgroundColor: "#fff",
    maxHeight: "150px",
    overflowY: "auto",
    borderRadius: "5px"
  },
  option: {
    padding: "10px",
    cursor: "pointer",
    borderBottom: "1px solid #eee"
  }
};
