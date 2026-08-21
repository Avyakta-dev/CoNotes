import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { api, getToken, getUser } from '../api';
import PresenceBar from '../components/PresenceBar.jsx';
import VersionHistory from '../components/VersionHistory.jsx';

const CURSOR_COLORS = ['#35C8B5', '#A4CF4A', '#000000', '#C2F2F4', '#FFF7BF'];
function randomColor() {
  return CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];
}

const WS_URL = `ws://${window.location.hostname}:4000`;

export default function Editor() {
  const { id: docId } = useParams();
  const navigate = useNavigate();
  const user = useMemo(() => getUser(), []);

  const [title, setTitle] = useState('');
  const [connected, setConnected] = useState(false);
  const [presentUsers, setPresentUsers] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const { ydoc, provider } = useMemo(() => {
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(WS_URL, docId, ydoc, {
      params: { token: getToken() },
    });
    return { ydoc, provider };
  }, [docId]);

  useEffect(() => {
    api(`/documents/${docId}`)
      .then((doc) => setTitle(doc.title))
      .catch(() => navigate('/'));

    provider.on('status', ({ status }) => setConnected(status === 'connected'));

    provider.awareness.setLocalStateField('user', {
      name: user?.name || 'Anonymous',
      color: randomColor(),
    });

    const updatePresence = () => {
      const states = Array.from(provider.awareness.getStates().values());
      setPresentUsers(states.map((s) => s.user).filter(Boolean));
    };
    provider.awareness.on('change', updatePresence);
    updatePresence();

    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [docId, provider, ydoc, navigate, user]);

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ history: false }),
        Collaboration.configure({ document: ydoc, field: 'default' }),
        CollaborationCursor.configure({
          provider,
          user: { name: user?.name || 'Anonymous', color: randomColor() },
        }),
      ],
    },
    [ydoc, provider]
  );

  return (
    <div className="min-h-screen bg-cream dark:bg-ink text-ink dark:text-cream">
      <div className="max-w-3xl mx-auto p-8">
        <header className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-ink/60 dark:text-cream/60 hover:text-turquoise"
          >
            &larr; Back
          </button>
          <h2 className="text-lg font-semibold">{title}</h2>
          <div className="flex items-center gap-3">
            <span
              className={`w-2 h-2 rounded-full ${connected ? 'bg-turquoise' : 'bg-red-500'}`}
            />
            <span className="text-xs text-ink/50 dark:text-cream/50">
              {connected ? 'Live' : 'Connecting...'}
            </span>
            <button
              onClick={() => setHistoryOpen(true)}
              className="text-xs border border-ink/20 dark:border-cream/20 rounded-md px-3 py-1.5 hover:bg-turquoise/20"
            >
              Version history
            </button>
          </div>
        </header>

        <PresenceBar users={presentUsers} />

        <div className="bg-mint/40 dark:bg-white/5 border border-ink/10 dark:border-cream/10 rounded-xl p-6 min-h-[60vh]">
          <EditorContent editor={editor} className="prose dark:prose-invert max-w-none" />
        </div>
      </div>

      <VersionHistory docId={docId} open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}