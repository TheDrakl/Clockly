import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import Services from './pages/Services.jsx';
import Bookings from './pages/Bookings.jsx';
import Slots from './pages/Slots.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PublicRoute from './components/PublicRoute.jsx';
import { jwtDecode } from 'jwt-decode';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isTokenExpired(token)) {
      setIsAuthenticated(true);
    } else {
      handleLogOut(); 
    }
    setLoading(false);
  }, []);

  const isTokenExpired = (token) => {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  };

  const handleLogOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    setIsAuthenticated(false);
    navigate('/login');
  };

  if (loading) return <div className="p-8 text-center text-xl">Loading...</div>;

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