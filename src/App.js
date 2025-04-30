import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate
} from "react-router-dom";

import Home from "./pages/Home";
import Upload from "./pages/Upload";
import Wishlist from "./pages/Wishlist";
import Search from "./pages/Search";
import ChatPage from "./pages/Chat";
import { UserProvider, useUser } from "./context/UserContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./components/Chat";
import ReservedBooks from "./pages/ReservedBooks";

function App() {
  const { user, logout } = useUser();
  const location = useLocation();
  const navigate = useNavigate(); // ✅ הוסף את זה

  // הסתרת navbar בדפי התחברות / הרשמה
  const hideNavbar = location.pathname === "/" || location.pathname === "/register";

  return (
    <div>
      {!hideNavbar && (
        <nav style={styles.navbar}>
          <Link to="/home" style={styles.link}>בית</Link>
          <Link to="/upload" style={styles.link}>העלאת ספר</Link>
          <Link to="/wishlist" style={styles.link}>חסרים</Link>
          <Link to="/search" style={styles.link}>חיפוש</Link>
          <Link to="/chat" style={styles.link}>צ'אט</Link>
          <Link to="/reserved-books" style={styles.link}>הספרים שלי</Link>

          {user && (
            <>
              <span style={styles.link}>שלום, {user.username}</span>
              <button
                onClick={() => {
                  logout();
                  navigate("/"); // ✅ העברה למסך התחברות
                }}
                style={styles.logoutButton}
              >
                התנתק
              </button>
            </>
          )}
        </nav>
      )}

      <div style={styles.content}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/search" element={<Search />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chatpage" element={<ChatPage />} />
          <Route path="/reserved-books" element={<ReservedBooks />} />

        </Routes>
      </div>
    </div>
  );
}

const styles = {
  navbar: {
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#e0e0e0",
    padding: "10px",
    fontWeight: "bold",
    fontSize: "1rem"
  },
  link: {
    color: "#333",
    textDecoration: "none",
  },
  content: {
    padding: "20px",
    textAlign: "right",
    direction: "rtl"
  },
  logoutButton: {
    backgroundColor: "#f44336",
    color: "white",
    border: "none",
    borderRadius: "5px",
    padding: "5px 10px",
    cursor: "pointer",
    fontSize: "0.9rem"
  }
};

function AppWrapper() {
  return (
    <UserProvider>
      <Router>
        <App />
      </Router>
    </UserProvider>
  );
}

export default AppWrapper;
