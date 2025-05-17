import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation
} from "react-router-dom";

import Home from "./pages/Home";
import Upload from "./pages/Upload";
import Wishlist from "./pages/Wishlist";
import Search from "./pages/Search";
import { UserProvider } from "./context/UserContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./components/Chat";
import ReservedBooks from "./pages/ReservedBooks";
import Navbar from "/components/Navbar"; // ✅ זה התפריט החדש

function AppContent() {
  const location = useLocation();

  const hideNavbar = location.pathname === "/" || location.pathname === "/register";

  return (
    <div>
      {!hideNavbar && <Navbar />}
      <div style={{ padding: "20px", direction: "rtl" }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/search" element={<Search />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/reserved-books" element={<ReservedBooks />} />
        </Routes>
      </div>
    </div>
  );
}

function AppWrapper() {
  return (
    <UserProvider>
      <Router>
        <AppContent />
      </Router>
    </UserProvider>
  );
}

export default AppWrapper;
