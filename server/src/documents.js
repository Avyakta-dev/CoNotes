const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { authenticateToken } = require('./auth');

const router = express.Router();
router.use(authenticateToken); // every route below requires a logged-in user

// Small helper: does this user have access (owner or shared) to this doc?
function getAccessibleDoc(docId, userId) {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
  if (!doc) return null;
  if (doc.owner_id === userId) return { doc, role: 'owner' };
  const access = db
    .prepare('SELECT role FROM document_access WHERE document_id = ? AND user_id = ?')
    .get(docId, userId);
  return access ? { doc, role: access.role } : null;
}

// POST /documents  { title }
router.post('/', (req, res) => {
  const id = uuidv4();
  const title = req.body.title || 'Untitled document';
  db.prepare('INSERT INTO documents (id, title, owner_id) VALUES (?, ?, ?)')
    .run(id, title, req.user.id);
  res.json({ id, title });
});

// GET /documents  -> everything I own + everything shared with me
router.get('/', (req, res) => {
  const owned = db
    .prepare("SELECT id, title, updated_at, 'owner' as role FROM documents WHERE owner_id = ?")
    .all(req.user.id);
  const shared = db
    .prepare(
      `SELECT d.id, d.title, d.updated_at, a.role
       FROM documents d JOIN document_access a ON d.id = a.document_id
       WHERE a.user_id = ?`
    )
    .all(req.user.id);
  res.json([...owned, ...shared]);
});

// GET /documents/:id  -> metadata only (the live text comes over WebSocket)
router.get('/:id', (req, res) => {
  const result = getAccessibleDoc(req.params.id, req.user.id);
  if (!result) return res.status(404).json({ error: 'not found or no access' });
  res.json({ id: result.doc.id, title: result.doc.title, role: result.role });
});

// POST /documents/:id/share  { email, role }
// Only the owner can share. Looks up the invitee by email and grants access.
router.post('/:id/share', (req, res) => {
  const result = getAccessibleDoc(req.params.id, req.user.id);
  if (!result || result.role !== 'owner') {
    return res.status(403).json({ error: 'only the owner can share this document' });
  }

  const { email, role = 'editor' } = req.body;
  const invitee = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (!invitee) return res.status(404).json({ error: 'no user with that email' });

  db.prepare(
    `INSERT INTO document_access (document_id, user_id, role) VALUES (?, ?, ?)
     ON CONFLICT(document_id, user_id) DO UPDATE SET role = excluded.role`
  ).run(req.params.id, invitee.id, role);

  res.json({ ok: true });
});

// GET /documents/:id/versions -> list of snapshots (id + timestamp only,
// not the full content, to keep the list light)
router.get('/:id/versions', (req, res) => {
  const result = getAccessibleDoc(req.params.id, req.user.id);
  if (!result) return res.status(404).json({ error: 'not found or no access' });

  const versions = db
    .prepare(
      'SELECT id, created_at FROM snapshots WHERE document_id = ? ORDER BY created_at DESC LIMIT 50'
    )
    .all(req.params.id);
  res.json(versions);
});

// POST /documents/:id/versions/:versionId/restore
// Restoring is handled inside ws.js because it has to touch the LIVE
// in-memory Yjs document, not just the database row. This route just
// validates access and hands off.
const { restoreSnapshot } = require('./ws');
router.post('/:id/versions/:versionId/restore', (req, res) => {
  const result = getAccessibleDoc(req.params.id, req.user.id);
  if (!result || result.role === 'viewer') {
    return res.status(403).json({ error: 'no edit access' });
  }
  const snapshot = db
    .prepare('SELECT content FROM snapshots WHERE id = ? AND document_id = ?')
    .get(req.params.versionId, req.params.id);
  if (!snapshot) return res.status(404).json({ error: 'snapshot not found' });

  restoreSnapshot(req.params.id, snapshot.content);
  res.json({ ok: true });
});

module.exports = router;