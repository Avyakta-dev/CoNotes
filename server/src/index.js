require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');

const { router: authRouter } = require('./auth');
const documentsRouter = require('./documents');
const setupWS = require('./ws');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);
app.use('/documents', documentsRouter);

app.get('/health', (req, res) => res.json({ ok: true }));

const server = http.createServer(app);
setupWS(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`collabnotes server listening on http://localhost:${PORT}`);
});