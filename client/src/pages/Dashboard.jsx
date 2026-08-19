import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, clearSession, getUser } from '../api';

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
    <div className="min-h-screen bg-gray-950 text-white p-8 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">CollabNotes</h1>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">{user?.name}</span>
          <button
            onClick={handleLogout}
            className="border border-gray-700 text-sm rounded-md px-3 py-1.5 hover:bg-gray-800"
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
          className="flex-1 bg-gray-900 border border-gray-800 rounded-md px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap"
        >
          + New document
        </button>
      </form>

      <ul className="flex flex-col">
        {docs.map((doc) => (
          <li
            key={doc.id}
            className="flex items-center gap-3 py-3 border-b border-gray-800"
          >
            <span
              onClick={() => navigate(`/docs/${doc.id}`)}
              className="flex-1 cursor-pointer hover:text-indigo-400"
            >
              {doc.title}
            </span>
            <span className="text-xs text-gray-500 uppercase">{doc.role}</span>
            {doc.role === 'owner' && (
              <button
                onClick={() => handleShare(doc.id)}
                className="border border-gray-700 text-xs rounded-md px-2 py-1 hover:bg-gray-800"
              >
                Share
              </button>
            )}
          </li>
        ))}
        {docs.length === 0 && (
          <p className="text-gray-500 text-sm">No documents yet -- create one above.</p>
        )}
      </ul>
    </div>
  );
}