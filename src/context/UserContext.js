// User Authentication Context
// This file manages the global user authentication state and provides login/logout functionality
// It uses React Context to make user data available throughout the application
// The context persists user data in localStorage to maintain sessions across page refreshes

import { createContext, useContext, useState, useEffect } from "react";

// Create a context for user data with null as initial value
// This context will store the current user's information and authentication methods
const UserContext = createContext(null);

// Get initial user state from localStorage
const getInitialUser = () => {
  const storedUser = localStorage.getItem("user");
  return storedUser ? JSON.parse(storedUser) : null;
};

// UserProvider Component
// This component wraps the entire application to provide user authentication state
// It manages user data persistence and provides login/logout functionality
export const UserProvider = ({ children }) => {
  // Initialize state with data from localStorage
  const [user, setUser] = useState(getInitialUser);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved user data on app initialization
  // This effect runs once when the component mounts
  // It checks localStorage for any existing user session
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      localStorage.removeItem("user"); // Clear invalid data
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login Function
  // Accepts a user object containing authentication data
  // Updates both state and localStorage with the new user data
  const login = (userObject) => {
    try {
      setUser(userObject);
      localStorage.setItem("user", JSON.stringify(userObject));
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  };

  // Logout Function
  // Clears the user data from both state and localStorage
  // This effectively ends the user's session
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // Check if user token is expired
  useEffect(() => {
    if (user?.token) {
      try {
        const tokenData = JSON.parse(atob(user.token.split('.')[1]));
        const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
        
        if (Date.now() >= expirationTime) {
          console.log("Token expired, logging out");
          logout();
        }
      } catch (error) {
        console.error("Error checking token expiration:", error);
      }
    }
  }, [user]);

  if (isLoading) {
    return <div>טוען...</div>; // או כל מסך טעינה אחר שתרצה
  }

  // Context Provider
  // Makes the user state and authentication functions available to all child components
  // Values provided:
  // - user: current user object or null if not logged in
  // - login: function to log in a user
  // - logout: function to log out the current user
  return (
    <UserContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom Hook: useUser
// Provides easy access to the user context in any component
// Returns an object containing:
// - user: the current user object (null if not logged in)
// - login: function to log in a user
// - logout: function to log out the current user
// Throws an error if used outside of UserProvider
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
