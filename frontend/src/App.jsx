import { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import Services from './pages/Services.jsx';
import Bookings from './pages/Bookings.jsx';
import Slots from './pages/Slots.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PublicRoute from './components/PublicRoute.jsx';
import UserBook from './pages/UserBook.jsx'
import { jwtDecode } from 'jwt-decode';

console.log('App component imported');

function App() {
  console.log('App component rendering');
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('App useEffect running');
    const checkAuth = async () => {
      try {
        console.log('Checking authentication...');
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found');
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        try {
          const expired = isTokenExpired(token);
          if (!expired) {
            console.log('Token is valid');
            setIsAuthenticated(true);
          } else {
            console.log('Token expired, trying to refresh');
            const success = await tryRefreshToken();
            if (success) {
              console.log('Token refreshed successfully');
              setIsAuthenticated(true);
            } else {
              console.log('Token refresh failed');
              setIsAuthenticated(false);
            }
          }
        } catch (error) {
          console.error('Error checking token:', error);
          setError(error.message);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error in checkAuth:', error);
        setError(error.message);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const isTokenExpired = (token) => {
    if (!token || typeof token !== 'string' || !token.includes('.')) {
      return true;
    }
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  };

  const tryRefreshToken = async () => {
    try {
      console.log("Attempting to refresh token...");
      const refreshToken = localStorage.getItem('refresh');
      if (!refreshToken || typeof refreshToken !== 'string' || !refreshToken.includes('.')) {
        console.log('Invalid refresh token');
        return false;
      }

      const response = await fetch('http://127.0.0.1:8000/api/auth/token/refresh/', {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        console.error('Token refresh failed with status:', response.status);
        return false;
      }

      const data = await response.json();
      if (!data.access || !data.refresh) {
        console.error('Invalid token response');
        return false;
      }
      localStorage.setItem('token', data.access);
      localStorage.setItem('refresh', data.refresh);
      return true;
    } catch (err) {
      console.error('Token refresh failed:', err);
      return false;
    }
  };

  const handleLogOut = () => {
    console.log('Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    setIsAuthenticated(false);
    window.location.href = '/login';
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
    console.log('App is loading...');
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl mb-4">Loading...</h1>
        <p className="text-gray-600">Please wait while we initialize the application</p>
      </div>
    );
  }

  console.log('App rendering main content');
  return (
    <div>
      <nav className="p-4 bg-gray-800 text-white flex gap-12 justify-center text-lg">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        {isAuthenticated ? (
          <>
            <button type="button" onClick={handleLogOut}>Log Out</button>
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
        <Route path="/register" element={
          <PublicRoute isAuthenticated={isAuthenticated}>
            <Register onAuth={() => setIsAuthenticated(true)} />
          </PublicRoute>
        } />
        <Route path="/login" element={
          <PublicRoute isAuthenticated={isAuthenticated}>
            <Login onAuth={() => setIsAuthenticated(true)} />
          </PublicRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/services" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Services />
          </ProtectedRoute>
        } />
        <Route path="/bookings" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Bookings />
          </ProtectedRoute>
        } />
        <Route path="/slots" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <Slots />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;