import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/api";
import ErrorMessage from "../components/ErrorMessage.jsx";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";

function RegisterForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    password2: "",
    username: "",
    phone: "",
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login, setIsAuthenticated } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await api.post("/api/auth/register/", formData);
      setIsVerifying(true);
    } catch (error) {
      setError(error.response?.data?.message || "Registration failed");
      console.error(error);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post("/api/auth/verify/", {
        email: formData.email,
        verification_code: verificationCode,
      });

      await login({
        email: formData.email,
        password: formData.password,
      });

      navigate("/profile");
    } catch (error) {
      setError(error.response?.data?.message || "Verification failed");
      console.error(error);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter the verification code sent to your email
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleVerification}>
              <div>
                <label
                  htmlFor="verificationCode"
                  className="block text-sm font-medium text-gray-700"
                >
                  Verification Code
                </label>
                <div className="mt-1">
                  <input
                    id="verificationCode"
                    name="verificationCode"
                    type="text"
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="min-h-screen bg-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 mt-[-10rem]">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {error && <ErrorMessage error={error} />}
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
              <h2 className="text-center text-3xl font-extrabold text-white mb-8">
                Create your account
              </h2>
            </div>
            <div className="w-full flex justify-center">
              <div className="w-full max-w-xs">
                <GoogleLogin
                  theme="filled_black"
                  size="large"
                  text="signin_with"
                  shape="pill"
                  onSuccess={async (credentialResponse) => {
                    try {
                      const { data } = await api.post(
                        "/api/auth/oauth/google/",
                        {
                          token: credentialResponse.credential,
                        }
                      );

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
              {/* OR separator */}
            </div>
            <div className="text-center text-sm text-gray-500 my-4">or</div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-white"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full py-[0.2rem] text-text-gray rounded-md bg-bg-card shadow-sm focus:outline-none focus:ring-0 focus:border-gray-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-white"
                >
                  Username
                </label>
                <div className="mt-1">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className="mt-1 block w-full py-[0.2rem] text-text-gray rounded-md bg-bg-card shadow-sm focus:outline-none focus:ring-0 focus:border-gray-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-white"
                >
                  Phone Number
                </label>
                <div className="mt-1">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 block w-full py-[0.2rem] text-text-gray rounded-md bg-bg-card shadow-sm focus:outline-none focus:ring-0 focus:border-gray-800 text-sm"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-white"
                >
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="mt-1 block w-full py-[0.2rem] text-text-gray rounded-md bg-bg-card shadow-sm focus:outline-none focus:ring-0 focus:border-gray-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password2"
                  className="block text-sm font-medium text-white"
                >
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="password2"
                    name="password2"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password2}
                    onChange={handleChange}
                    className="mt-1 block w-full py-[0.2rem] text-text-gray rounded-md bg-bg-card shadow-sm focus:outline-none focus:ring-0 focus:border-gray-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}

export default RegisterForm;
