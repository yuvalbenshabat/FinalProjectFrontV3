// 📁 components/Navbar.js
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import "../styles/Navbar.css";
import logo from "../assets/logo.png"; // ודא שהקובץ קיים

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const hideNavbar = location.pathname === "/" || location.pathname === "/register";

  if (hideNavbar) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <img src={logo} alt="logo" />
          <span>Bookit</span>
        </div>

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? "✖" : "☰"}
        </button>

        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
          <Link to="/home">בית</Link>
          <Link to="/upload">העלאת ספר</Link>
          <Link to="/wishlist">חסרים</Link>
          <Link to="/search">חיפוש</Link>
          <Link to="/chat">צ'אט</Link>
          <Link to="/reserved-books">הספרים שלי</Link>

          {user && (
            <>
              <span>שלום, {user.username}</span>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="logout"
              >
                התנתק
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
