import { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import Services from "./pages/Services.jsx";
import Bookings from "./pages/Bookings.jsx";
import Slots from "./pages/Slots.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicRoute from "./components/PublicRoute.jsx";
import UserBook from "./pages/UserBook.jsx";
import { jwtDecode } from "jwt-decode";
import api from './api/api';

console.log("App component imported");

function App() {
  console.log("App component rendering");

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.get('/api/auth/check-auth/');
        setIsAuthenticated(true);
      } catch (err) {
        if (err.response?.status === 401) {
          setIsAuthenticated(false);
        } else {
          console.warn("Unexpected response status:", err.response?.status);
          setIsAuthenticated(false);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogOut = async () => {
    console.log("Logging out...");
    try {
      await api.post('/api/auth/logout/');
      console.log("User is logged out");
      setIsAuthenticated(false);
    } catch (error) {
      console.log("User is NOT logged out");
      window.location.href = "/login";
    }
  };

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <h1 className="text-2xl font-bold mb-4">Error</h1>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reload Page
        </button>
      </div>
    );
  }

  if (loading) {
    console.log("App is loading...");
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl mb-4">Loading...</h1>
        <p className="text-gray-600">
          Please wait while we initialize the application
        </p>
      </div>
    );
  }

  console.log("App rendering main content");
  return (
    <div>
      <nav className="p-4 bg-gray-800 text-white flex gap-12 justify-center text-lg">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        {isAuthenticated ? (
          <>
            <button type="button" onClick={handleLogOut}>
              Log Out
            </button>
            <Link to="/services">Services</Link>
            <Link to="/bookings">Bookings</Link>
            <Link to="/slots">Slots</Link>
            <Link to="/profile">Profile</Link>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/users/:username" element={<UserBook />} />
        <Route
          path="/register"
          element={
            <PublicRoute isAuthenticated={isAuthenticated}>
              <Register onAuth={() => setIsAuthenticated(true)} />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute isAuthenticated={isAuthenticated}>
              <Login onAuth={() => setIsAuthenticated(true)} />
            </PublicRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/services"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Services />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Bookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/slots"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <Slots />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
