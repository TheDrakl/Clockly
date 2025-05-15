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
import { AuthProvider, useAuth } from "./contexts/AuthContext";

function AppContent() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div>
      <nav className="p-4 bg-nav flex gap-12 justify-center text-lg">
        <Link to="/" className='link'>Home</Link>
        <Link to="/about" className='link'>About</Link>
        {isAuthenticated ? (
          <>
            <button type="button" className="link" onClick={logout}>
              Log Out
            </button>
            <Link to="/services" className="link">
              Services
            </Link>
            <Link to="/bookings" className="link">
              Bookings
            </Link>
            <Link to="/slots" className="link">
              Slots
            </Link>
            <Link to="/profile" className="link">
              Profile
            </Link>
          </>
        ) : (
          <>
            <Link to="/login" className="link">
              Login
            </Link>
            <Link to="/register" className="link">
              Register
            </Link>
          </>
        )}
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/users/:user_slug" element={<UserBook />} />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/services"
          element={
            <ProtectedRoute>
              <Services />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <Bookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/slots"
          element={
            <ProtectedRoute>
              <Slots />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
