import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthForm({
  email, setEmail, password, setPassword, authMode, setAuthMode,
  handleLogin, handleRegister
}) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center bg-white rounded-xl shadow-lg p-8 mb-8 w-full max-w-sm border border-gray-200">
      <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">{authMode === 'login' ? 'Login' : 'Register'}</h2>
      <div className="w-full mb-4">
        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="email">Email</label>
        <input
          id="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          autoComplete="username"
        />
      </div>
      <div className="w-full mb-6">
        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">Password</label>
        <input
          id="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
        />
      </div>
      {authMode === 'login' ? (
        <>
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg shadow mb-3 transition-colors duration-200"
          >
            Login
          </button>
          <p className="text-sm text-gray-600 text-center">
            Don't have an account?{' '}
            <button
              onClick={() => setAuthMode('register')}
              className="text-blue-600 hover:underline font-semibold"
            >
              Register
            </button>
          </p>
        </>
      ) : (
        <>
          <button
            onClick={handleRegister}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg shadow mb-3 transition-colors duration-200"
          >
            Register
          </button>
          <p className="text-sm text-gray-600 text-center">
            Already have an account?{' '}
            <button
              onClick={() => setAuthMode('login')}
              className="text-blue-600 hover:underline font-semibold"
            >
              Login
            </button>
          </p>
        </>
      )}
    </div>
  );
}
