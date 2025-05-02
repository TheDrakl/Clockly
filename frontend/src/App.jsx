import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import Services from './pages/Services.jsx'
import Bookings from './pages/Bookings.jsx';
import Slots from './pages/Slots.jsx';
import { jwtDecode } from 'jwt-decode';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      isTokenExpired(token) ? handleLogOut() : setIsAuthenticated(true);
    }
  }, []);

  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
    const decoded = jwtDecode(token);
    console.log(decoded);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  }

  const handleLogOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    setIsAuthenticated(false);
    console.log('User logged out');
    navigate('/login');
  };

  return (
    <div>
      <nav className="p-4 bg-gray-800 text-white flex gap-4">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        {isAuthenticated ? (
          <>
          <button type="button" onClick={handleLogOut}>Log Out</button>
          <Link to='/services'>Services</Link>
          <Link to='/bookings'>Bookings</Link>
          <Link to='/slots'>Slots</Link>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
        {isAuthenticated && <Link to="/profile">Profile</Link>}
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/register" element={<Register onAuth={() => setIsAuthenticated(true)} />} />
        <Route path="/login" element={<Login onAuth={() => setIsAuthenticated(true)} />} />
        <Route path="/profile" element={<Profile />} />
        <Route path='/services' element={<Services />} />
        <Route path='/bookings' element={<Bookings />} />
        <Route path='/slots' element={<Slots />} />
      </Routes>
    </div>
  );
}

export default App;