import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearSession, getUser } from '../api';
import ThemeToggle from '../components/ThemeToggle.jsx';

export default function Dashboard() {
  const [docs, setDocs] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const navigate = useNavigate();
  const user = getUser();

  async function loadDocs() {
    const list = await api('/documents');
    setDocs(list);
  }

  useEffect(() => {
    loadDocs();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    const title = newTitle.trim() || 'Untitled document';
    const doc = await api('/documents', { method: 'POST', body: { title } });
    setNewTitle('');
    navigate(`/docs/${doc.id}`);
  }

  async function handleShare(docId) {
    const email = prompt("Share with (collaborator's email):");
    if (!email) return;
    try {
      await api(`/documents/${docId}/share`, { method: 'POST', body: { email, role: 'editor' } });
      alert(`Shared with ${email}`);
    } catch (err) {
      alert(err.message);
    }
  }

  function handleLogout() {
    clearSession();
    navigate('/login');
  }

  return (
   <div className="min-h-screen bg-cream dark:bg-ink text-ink dark:text-cream">
      <div className="max-w-3xl mx-auto p-8">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">CollabNotes</h1>
          <div className="flex items-center gap-4">
            <span className="text-ink/60 dark:text-cream/60 text-sm">{user?.name}</span>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="border border-ink/20 dark:border-cream/20 text-sm rounded-md px-3 py-1.5 hover:bg-turquoise/20 transition"
            >
              Log out
            </button>
          </div>
        </header>

        <form onSubmit={handleCreate} className="flex gap-2 mb-8">
          <input
            placeholder="New document title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 bg-white/60 dark:bg-white/5 border border-ink/10 dark:border-cream/20 rounded-md px-3 py-2 text-sm outline-none focus:border-turquoise placeholder:text-ink/40 dark:placeholder:text-cream/40"
          />
          <button
            type="submit"
            className="bg-turquoise hover:bg-turquoise/90 text-white rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition"
          >
            + New document
          </button>
        </form>

        <ul className="flex flex-col">
          {docs.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-3 py-3 border-b border-ink/10 dark:border-cream/10"
            >
              <span
                onClick={() => navigate(`/docs/${doc.id}`)}
                className="flex-1 cursor-pointer hover:text-turquoise transition-colors"
              >
                {doc.title}
              </span>
              <span className="text-xs text-ink/40 dark:text-cream/40 uppercase tracking-wide">
                {doc.role}
              </span>
              {doc.role === 'owner' && (
                <button
                  onClick={() => handleShare(doc.id)}
                  className="border border-ink/20 dark:border-cream/20 text-xs rounded-md px-2 py-1 hover:bg-turquoise/20 transition"
                >
                  Share
                </button>
              )}
            </li>
          ))}
          {docs.length === 0 && (
            <p className="text-ink/40 dark:text-cream/40 text-sm">
              No documents yet -- create one above.
            </p>
          )}
        </ul>
      </div>
    </div>
  );
}