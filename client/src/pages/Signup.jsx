import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, saveSession } from '../api';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const { token, user } = await api('/auth/signup', {
        method: 'POST',
        body: { name, email, password },
      });
      saveSession(token, user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-80 flex flex-col gap-3"
      >
        <h1 className="text-2xl font-semibold text-white">CollabNotes</h1>
        <p className="text-gray-400 text-sm -mt-2">Create an account</p>

        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-md py-2 text-sm font-medium transition"
        >
          Sign up
        </button>

        <p className="text-gray-400 text-xs text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}