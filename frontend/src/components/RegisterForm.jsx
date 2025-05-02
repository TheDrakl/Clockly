import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function RegisterForm({ onAuth }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);

  // Handle user registration
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, password2 }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowVerification(true);
        setErrorMessage('');
        setSuccessMessage('Registration successful! Please check your email for the verification code.');
      } else {
        setErrorMessage(data.message || 'Registration failed');
        setSuccessMessage('');
      }
    } catch (error) {
      setErrorMessage('Something went wrong. Please try again.');
      console.error(error);
    }
  };

  // Handle verification code submission
  const handleVerificationCode = async (e) => {
    e.preventDefault();

    if (!verificationCode) {
      setErrorMessage('Please enter the verification code.');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/verify/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email, 
          username: username, 
          password: password, 
          password2: password2, 
          verification_code: verificationCode
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Verification successful! You can now log in.');
        setErrorMessage('');
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('refresh', data.refresh_token);
        if (onAuth) onAuth();
      } else {
        setErrorMessage(data.message || 'Verification failed');
        setSuccessMessage('');
      }
    } catch (error) {
      setErrorMessage('Something went wrong. Please try again.');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-inter px-4">
      <div className="w-full max-w-md bg-white shadow-md rounded-xl p-8 space-y-6">
        <h2 className="text-3xl font-bold text-center text-gray-800">Create Account</h2>

        {/* Registration Form */}
        {!showVerification ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="email"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                id="username"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                placeholder="your_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                id="password"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="password2" className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <input
                type="password"
                id="password2"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                placeholder="••••••••"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
            {successMessage && <p className="text-sm text-green-500">{successMessage}</p>}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium"
            >
              Register
            </button>
          </form>
        ) : (
          // Verification Form
          <form onSubmit={handleVerificationCode} className="space-y-5">
            <div>
              <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">Verification Code</label>
              <input
                type="text"
                id="verificationCode"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
                autoComplete="off"
              />
            </div>

            {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
            {successMessage && <p className="text-sm text-green-500">{successMessage}</p>}

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition text-sm font-medium"
            >
              Verify Code
            </button>
          </form>
        )}

        <div className="text-center text-sm text-gray-600">
          Already have an account?
          <Link to="/login" className="ml-1 text-blue-500 hover:underline">Login</Link>
        </div>
      </div>
    </div>
  );
}