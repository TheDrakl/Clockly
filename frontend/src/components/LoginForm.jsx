import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import api from "../api/api";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { login, setIsAuthenticated } = useAuth();
  const navigate = useNavigate();

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({ email, password });
      navigate("/profile");
    } catch (error) {
      if (error.response && error.response.data) {
        setErrorMessage(error.response.data.message || "Login failed");
      } else {
        setErrorMessage("Something went wrong");
      }
      console.error(error);
    }
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="min-h-screen flex items-center justify-center bg-bg font-inter px-4">
        <div className="w-full max-w-md bg-bg-card shadow-md rounded-xl p-8 space-y-6 mt-[-10rem]">
          <h2 className="text-3xl font-bold text-center text-white">Sign In</h2>
          <div className="w-full flex justify-center">
            <div className="w-full max-w-xs">
              <GoogleLogin
                theme="filled_black"
                size="large"
                text="signin_with"
                shape="pill"
                onSuccess={async (credentialResponse) => {
                  try {
                    const { data } = await api.post("/api/auth/oauth/google/", {
                      token: credentialResponse.credential,
                    });

                    console.log("Backend response:", data);

                    setIsAuthenticated(true);
                    navigate("/profile");
                  } catch (error) {
                    console.error("Google login error:", error);
                    setErrorMessage("Google login failed");
                  }
                }}
                onError={() => {
                  console.log("Login Failed");
                  setErrorMessage("Google login failed");
                }}
                useOneTap={false}
              />
            </div>
          </div>
          {/* OR separator */}
          <div className="text-center text-sm text-gray-500 my-4">or</div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                className="mt-1 block w-full py-[0.2rem] text-text-gray rounded-md bg-bg-card shadow-sm focus:outline-none focus:ring-0 focus:border-gray-800 text-sm"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                className="mt-1 block w-full py-[0.2rem] text-text-gray rounded-md bg-bg-card shadow-sm focus:outline-none focus:ring-0 focus:border-gray-800 text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {errorMessage && (
              <p className="text-sm text-red-500">{errorMessage}</p>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium"
            >
              Login
            </button>
          </form>
          <div className="text-center">
            <a href="#" className="text-sm text-blue-500 hover:underline">
              Forgot password?
            </a>
          </div>
          <div className="text-center text-sm text-text-main">
            Don't have an account?
            <Link to="/register" className="ml-1 text-blue-500 hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
