import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, saveSession } from '../api';
import ThemeToggle from '../components/ThemeToggle.jsx';

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
     <div className="min-h-screen flex items-center justify-center bg-cream dark:bg-ink relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <form
        onSubmit={handleSubmit}
        className="bg-mint dark:bg-ink dark:border dark:border-turquoise/40 rounded-xl p-8 w-80 flex flex-col gap-3 shadow-sm"
      >
        <h1 className="text-2xl font-semibold text-ink dark:text-cream">CollabNotes</h1>
        <p className="text-ink/60 dark:text-cream/60 text-sm -mt-2">Create an account</p>

        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="bg-white/60 dark:bg-white/5 border border-ink/10 dark:border-cream/20 text-ink dark:text-cream rounded-md px-3 py-2 text-sm outline-none focus:border-turquoise placeholder:text-ink/40 dark:placeholder:text-cream/40"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-white/60 dark:bg-white/5 border border-ink/10 dark:border-cream/20 text-ink dark:text-cream rounded-md px-3 py-2 text-sm outline-none focus:border-turquoise placeholder:text-ink/40 dark:placeholder:text-cream/40"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="bg-white/60 dark:bg-white/5 border border-ink/10 dark:border-cream/20 text-ink dark:text-cream rounded-md px-3 py-2 text-sm outline-none focus:border-turquoise placeholder:text-ink/40 dark:placeholder:text-cream/40"
        />

        {error && <p className="text-red-600 dark:text-red-400 text-xs">{error}</p>}

        <button
          type="submit"
          className="bg-turquoise hover:bg-turquoise/90 text-white rounded-md py-2 text-sm font-medium transition"
        >
          Sign up
        </button>

        <p className="text-ink/60 dark:text-cream/60 text-xs text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-turquoise hover:underline font-medium">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}