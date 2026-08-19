const WebSocket = require('ws');
const Y = require('yjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { setupWSConnection, docs, getYDoc } = require('y-websocket/bin/utils');
const db = require('./db');
const { JWT_SECRET } = require('./auth');

const AUTOSAVE_INTERVAL_MS = 15000;
const SNAPSHOT_INTERVAL_MS = 60000; 

let lastSnapshotAt = {};

function setupWS(server) {
  const wss = new WebSocket.Server({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    let url;
    try {
      url = new URL(request.url, `http://${request.headers.host}`);
    } catch {
      socket.destroy();
      return;
    }

    const token = url.searchParams.get('token');
    const documentId = url.pathname.slice(1);

    let user;
    try {
      user = jwt.verify(token, JWT_SECRET);
    } catch {
      socket.destroy();
      return;
    }

    const doc = db.prepare('SELECT owner_id FROM documents WHERE id = ?').get(documentId);
    if (!doc) return socket.destroy();

    const hasAccess =
      doc.owner_id === user.id ||
      db
        .prepare('SELECT 1 FROM document_access WHERE document_id = ? AND user_id = ?')
        .get(documentId, user.id);
    if (!hasAccess) return socket.destroy();

    request.documentId = documentId;
    request.user = user;

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws, req) => {
    const documentId = req.documentId;

    const ydoc = getYDoc(documentId);

    if (!ydoc._hydrated) {
      const row = db.prepare('SELECT content FROM documents WHERE id = ?').get(documentId);
      if (row && row.content) {
        Y.applyUpdate(ydoc, row.content);
      }
      ydoc._hydrated = true;
    }

    setupWSConnection(ws, req, { docName: documentId });
  });

  setInterval(() => {
    const now = Date.now();
    docs.forEach((ydoc, documentId) => {
      const state = Buffer.from(Y.encodeStateAsUpdate(ydoc));

      db.prepare(
        `UPDATE documents SET content = ?, updated_at = datetime('now') WHERE id = ?`
      ).run(state, documentId);

      const last = lastSnapshotAt[documentId] || 0;
      if (now - last >= SNAPSHOT_INTERVAL_MS) {
        db.prepare(
          'INSERT INTO snapshots (id, document_id, content) VALUES (?, ?, ?)'
        ).run(uuidv4(), documentId, state);
        lastSnapshotAt[documentId] = now;
      }
    });
  }, AUTOSAVE_INTERVAL_MS);

  return wss;
}

function restoreSnapshot(documentId, snapshotContent) {
  const ydoc = getYDoc(documentId);
  const liveFragment = ydoc.getXmlFragment('default'); 

  const snapshotDoc = new Y.Doc();
  Y.applyUpdate(snapshotDoc, snapshotContent);
  const snapshotFragment = snapshotDoc.getXmlFragment('default');

  ydoc.transact(() => {
    liveFragment.delete(0, liveFragment.length);
    liveFragment.insert(0, snapshotFragment.toArray().map((item) => item.clone()));
  });

  const state = Buffer.from(Y.encodeStateAsUpdate(ydoc));
  db.prepare(`UPDATE documents SET content = ?, updated_at = datetime('now') WHERE id = ?`).run(
    state,
    documentId
  );
}

module.exports = setupWS;
module.exports.restoreSnapshot = restoreSnapshot;