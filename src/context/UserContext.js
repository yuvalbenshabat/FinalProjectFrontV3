// User Authentication Context
// This file manages the global user authentication state and provides login/logout functionality
// It uses React Context to make user data available throughout the application
// The context persists user data in localStorage to maintain sessions across page refreshes

import { createContext, useContext, useState, useEffect } from "react";

// Create a context for user data with null as initial value
// This context will store the current user's information and authentication methods
const UserContext = createContext(null);

// UserProvider Component
// This component wraps the entire application to provide user authentication state
// It manages user data persistence and provides login/logout functionality
export const UserProvider = ({ children }) => {
  // State to hold the current user's data
  // null indicates no user is logged in
  const [user, setUser] = useState(null);

  // Load saved user data on app initialization
  // This effect runs once when the component mounts
  // It checks localStorage for any existing user session
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Login Function
  // Accepts a user object containing authentication data
  // Updates both state and localStorage with the new user data
  const login = (userObject) => {
    setUser(userObject);
    localStorage.setItem("user", JSON.stringify(userObject));
  };

  // Logout Function
  // Clears the user data from both state and localStorage
  // This effectively ends the user's session
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // Context Provider
  // Makes the user state and authentication functions available to all child components
  // Values provided:
  // - user: current user object or null if not logged in
  // - login: function to log in a user
  // - logout: function to log out the current user
  return (
    <UserContext.Provider value={{ user, login, logout }}>
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
export const useUser = () => useContext(UserContext);
