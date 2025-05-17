import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import "../styles/components.css";
import logo from "../assets/logo.png";

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
        <Link to="/home" className="navbar-logo">
          <img src={logo} alt="BookIt" className="navbar-logo-image" />
          <span className="navbar-logo-text">BookIt</span>
        </Link>

        <button 
          className="navbar-menu-button" 
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className="navbar-menu-icon">{menuOpen ? "✖" : "☰"}</span>
        </button>

        <div className={`navbar-links ${menuOpen ? "navbar-links-open" : ""}`}>
          <div className="navbar-nav">
            <Link to="/home" className="navbar-link">בית</Link>
            <Link to="/upload" className="navbar-link">העלאת ספר</Link>
            <Link to="/wishlist" className="navbar-link">חסרים</Link>
            <Link to="/search" className="navbar-link">חיפוש</Link>
            <Link to="/chat" className="navbar-link">צ'אט</Link>
            <Link to="/reserved-books" className="navbar-link">הספרים שלי</Link>
          </div>

          {user && (
            <div className="navbar-user">
              <span className="navbar-username">שלום, {user.username}</span>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="navbar-logout-button"
              >
                התנתק
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}