// Main Application Component
// This file serves as the root component of the application, handling routing and layout structure
// It wraps the entire app with necessary providers and sets up the routing configuration

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Upload from "./pages/Upload";
import Search from "./pages/Search";
import Wishlist from "./pages/Wishlist";
import ReservedBooks from "./pages/ReservedBooks";
import Chat from "./components/Chat";
import "./App.css";

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/home" element={<Home />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/search" element={<Search />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/reserved-books" element={<ReservedBooks />} />
              <Route path="/chat" element={<Chat />} />
            </Routes>
          </main>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;
