import { useEffect, useState } from 'react';
import { api } from '../api';

export default function VersionHistory({ docId, open, onClose }) {
  const [versions, setVersions] = useState([]);

  useEffect(() => {
    if (open) {
      api(`/documents/${docId}/versions`).then(setVersions).catch(() => {});
    }
  }, [open, docId]);

  async function handleRestore(versionId) {
    if (!confirm('Restore this version? This will replace the current content.')) return;
    await api(`/documents/${docId}/versions/${versionId}/restore`, { method: 'POST' });
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed top-0 right-0 h-screen w-72 bg-mint dark:bg-ink dark:border-l dark:border-turquoise/40 border-l border-ink/10 p-5 overflow-y-auto shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-ink dark:text-cream">Version history</h3>
        <button
          onClick={onClose}
          className="text-xs border border-ink/20 dark:border-cream/20 rounded-md px-2 py-1 hover:bg-turquoise/20"
        >
          Close
        </button>
      </div>
      <ul className="flex flex-col gap-1">
        {versions.map((v) => (
          <li
            key={v.id}
            className="flex items-center justify-between text-xs py-2 border-b border-ink/10 dark:border-cream/10 text-ink/80 dark:text-cream/80"
          >
            <span>{new Date(v.created_at + 'Z').toLocaleString()}</span>
            <button
              onClick={() => handleRestore(v.id)}
              className="border border-ink/20 dark:border-cream/20 rounded-md px-2 py-1 hover:bg-turquoise/20"
            >
              Restore
            </button>
          </li>
        ))}
        {versions.length === 0 && (
          <p className="text-ink/40 dark:text-cream/40 text-xs">
            No snapshots yet -- keep editing.
          </p>
        )}
      </ul>
    </div>
  );
}