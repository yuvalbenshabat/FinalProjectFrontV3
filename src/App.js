// Main Application Component
// This file serves as the root component of the application, handling routing and layout structure
// It wraps the entire app with necessary providers and sets up the routing configuration

import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Upload from "./pages/Upload";
import Search from "./pages/Search";
import Wishlist from "./pages/Wishlist";
import ReservedBooks from "./pages/ReservedBooks";
import Chat from "./pages/Chat";
import "./App.css";

// Protected Route Component
const ProtectedLayout = () => {
  const { user } = useUser();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/search" element={<Search />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/reserved-books" element={<ReservedBooks />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="app">
          <main>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/*" element={<ProtectedLayout />} />
            </Routes>
          </main>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;
