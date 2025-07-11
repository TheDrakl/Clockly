import { Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import Services from "./pages/Services.jsx";
import Bookings from "./pages/Bookings.jsx";
import Slots from "./pages/Slots.jsx";
import BookingVerify from "./pages/BookingVerify.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicRoute from "./components/PublicRoute.jsx";
import UserBook from "./pages/UserBook.jsx";
import ChatBot from "./components/ChatBot.jsx";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ScrollToTop from "./components/ScrollToTop.jsx";
import {
  FaTools,
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaSignOutAlt,
} from "react-icons/fa";

function AppContent() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Center Navigation */}
      <header className="text-white p-4">
        <div className="flex justify-center gap-8 text-lg">
          <NavLink
            to="/"
            className={({ isActive }) => (isActive ? "link active" : "link")}
          >
            Home
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? "link active" : "link")}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) => (isActive ? "link active" : "link")}
          >
            About
          </NavLink>
          {!isAuthenticated && (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  isActive ? "link active" : "link"
                }
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  isActive ? "link active" : "link"
                }
              >
                Register
              </NavLink>
            </>
          )}
        </div>
      </header>

      {/* Main layout: Sidebar + Page content */}
      <div className="flex flex-1">
        {isAuthenticated && (
          <aside className="group w-20 hover:w-64 px-2 py-6 overflow-hidden transition-all duration-300 ease-in-out border-r h-screen">
            <nav className="flex flex-col gap-6">
              {[
                { to: "/services", icon: <FaTools />, label: "Services" },
                { to: "/bookings", icon: <FaCalendarAlt />, label: "Bookings" },
                { to: "/slots", icon: <FaClock />, label: "Slots" },
                { to: "/profile", icon: <FaUser />, label: "Profile" },
              ].map(({ to, icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-[1.2rem] py-2 text-lg rounded-md transition-all duration-300 ease-in-out
      ${
        isActive
          ? "bg-indigo-500 text-white"
          : "text-text-main hover:bg-gray-400 hover:text-white"
      }`
                  }
                >
                  <div className="text-2xl w-8 flex justify-center">{icon}</div>
                  <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {label}
                  </span>
                </NavLink>
              ))}

              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-4 px-[1.2rem] py-2 text-lg link text-red-600 rounded-md transition-all duration-300 ease-in-out hover:text-red-500"
              >
                <div className="text-2xl w-8 flex justify-center">
                  <FaSignOutAlt />
                </div>
                <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Log Out
                </span>
              </button>
            </nav>
          </aside>
        )}

        <main className="flex-1 p-6">
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
            <Route
              path="/bookings/verify-booking/:token"
              element={<BookingVerify />}
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <ChatBotWithAuth />
    </AuthProvider>
  );
}

function ChatBotWithAuth() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <ChatBot /> : null;
}

export default App;