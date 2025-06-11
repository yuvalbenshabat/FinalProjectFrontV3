// Navigation Bar Component
// This component provides the main navigation menu for the application
// It includes the app logo, navigation links, and user authentication controls

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import "../styles/Navbar.css";
import logo from "../assets/logo.png";

export default function Navbar() {
  // All hooks must be called at the top level
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  // Function to show only the first name (before first space)
  const getFirstName = (username) => {
    if (!username) return '';
    // Split by space and return only the first part
    return username.split(' ')[0];
  };

  // Hide navbar on login and register pages
  const hideNavbar = location.pathname === "/" || location.pathname === "/register";

  // Close menu when clicking outside
  const handleClickOutside = (e) => {
    if (menuOpen && !e.target.closest('.navbar-container')) {
      setMenuOpen(false);
    }
  };

  // Add click outside listener
  useEffect(() => {
    if (menuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [menuOpen]);

  // Don't render anything if navbar should be hidden
  if (hideNavbar) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo and App Name */}
        <Link to="/home" className="navbar-logo">
          <img src={logo} alt="BookIt" className="navbar-logo-image" />
          <span className="navbar-logo-text">BookIt</span>
        </Link>

        {/* Mobile Menu Toggle Button */}
        <button 
          className="navbar-menu-button" 
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className="material-icons">
            {menuOpen ? "close" : "menu"}
          </span>
        </button>

        {/* Navigation Links and User Section */}
        <div className={`navbar-links ${menuOpen ? "navbar-links-open" : ""}`}>
          {/* Main Navigation Links */}
          <div className="navbar-nav">
            <Link to="/home" className="navbar-link">
              <span className="material-icons">home</span>
              <span>בית</span>
            </Link>
            <Link to="/upload" className="navbar-link">
              <span className="material-icons">upload</span>
              <span>העלאת ספר</span>
            </Link>
            <Link to="/wishlist" className="navbar-link">
              <span className="material-icons">favorite</span>
              <span>חסרים</span>
            </Link>
            <Link to="/search" className="navbar-link">
              <span className="material-icons">search</span>
              <span>חיפוש</span>
            </Link>
            <Link to="/chat" className="navbar-link">
              <span className="material-icons">chat</span>
              <span>צ'אט</span>
            </Link>
            <Link to="/reserved-books" className="navbar-link">
              <span className="material-icons">book</span>
              <span>הספרים שלי</span>
            </Link>
          </div>

          {/* User Information and Logout Section */}
          {user && (
            <div className="navbar-user">
              <span className="navbar-username" title={user.username}>
              {getFirstName(user.username)}<span className="material-icons">account_circle</span>
              </span>
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="navbar-logout-button"
              >
                <span className="material-icons">logout</span>
                התנתק
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}