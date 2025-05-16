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
import { NavLink } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop.jsx";

function AppContent() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div>
      <nav className="p-4 bg-nav flex gap-12 justify-center text-lg">
        <NavLink
          to="/"
          className={({ isActive }) => (isActive ? "link active" : "link")}
        >
          Home
        </NavLink>
        <NavLink
          to="/about"
          className={({ isActive }) => (isActive ? "link active" : "link")}
        >
          About
        </NavLink>

        {isAuthenticated ? (
          <>
            <NavLink
              to="/services"
              className={({ isActive }) => (isActive ? "link active" : "link")}
            >
              Services
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => (isActive ? "link active" : "link")}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/bookings"
              className={({ isActive }) => (isActive ? "link active" : "link")}
            >
              Bookings
            </NavLink>
            <NavLink
              to="/slots"
              className={({ isActive }) => (isActive ? "link active" : "link")}
            >
              Slots
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) => (isActive ? "link active" : "link")}
            >
              Profile
            </NavLink>
            <button type="button" className="link" onClick={logout}>
              Log Out
            </button>
          </>
        ) : (
          <>
            <NavLink
              to="/login"
              className={({ isActive }) => (isActive ? "link active" : "link")}
            >
              Login
            </NavLink>
            <NavLink
              to="/register"
              className={({ isActive }) => (isActive ? "link active" : "link")}
            >
              Register
            </NavLink>
          </>
        )}
      </nav>

      <ScrollToTop />

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
