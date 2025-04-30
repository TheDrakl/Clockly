import { useState } from 'react';

export default function RegisterForm({onAuth}) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username, password, password2 }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Registration successful! You can now log in.');
        setErrorMessage('');
        setEmail('');
        setPassword('');
        setPassword2('');
        setUsername('');
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('refresh', data.refresh_token);
        onAuth()
      } else {
        setErrorMessage(data.message || 'Registration failed');
        setSuccessMessage('');
      }
    } catch (error) {
      setErrorMessage('Something went wrong');
      console.error(error);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="card w-96 bg-base-100 shadow-xl p-8">
        <h2 className="text-center text-2xl font-semibold mb-6">Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="input input-bordered w-full"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              className="input input-bordered w-full"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="input input-bordered w-full"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password2" className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              type="password"
              id="password2"
              name="password2"
              className="input input-bordered w-full"
              placeholder="Re-enter your password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
            />
          </div>
          {errorMessage && <div className="text-red-500 mb-4">{errorMessage}</div>}
          {successMessage && <div className="text-green-500 mb-4">{successMessage}</div>}
          <div className="flex items-center justify-between mb-6">
            <button type="submit" className="btn btn-primary w-full">Register</button>
          </div>
        </form>
        <div className="text-center mt-4">
          <span className="text-sm text-gray-600">Already have an account? </span>
          <a href="#" className="text-sm text-blue-500 hover:text-blue-700">Login</a>
        </div>
      </div>
    </div>
  );
}