import express from 'express';
import sqlite3 from 'sqlite3';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.get('/version.txt', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'version.txt'));
});
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Créer les dossiers s'ils n'existent pas
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}
if (!fs.existsSync('uploads/documents')) {
  fs.mkdirSync('uploads/documents', { recursive: true });
}

// Configuration multer pour les uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

// Base de données
const db = new sqlite3.Database(':memory:');

// Initialiser la base de données
db.serialize(() => {
  // Table des projets
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      status TEXT DEFAULT 'En cours',
      market_value REAL DEFAULT 0,
      purchases REAL DEFAULT 0,
      labor REAL DEFAULT 0,
      margin REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Table des éléments de marché
  db.run(`
    CREATE TABLE IF NOT EXISTS market_items (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      value REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `);

  // Table des dépenses
  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      value REAL NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `);

  // Table des documents
  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size REAL NOT NULL,
      file_path TEXT NOT NULL,
      chantier TEXT,
      type TEXT,
      fournisseur TEXT,
      montant REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `);

  // Insérer un projet exemple
  const projectId = uuidv4();
  db.run(`
    INSERT INTO projects (id, name, code, status, market_value, purchases, labor, margin)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [projectId, 'YAYA', '2026-250', 'En cours', 21048, 1104, 630, 19314]);
});

// ============ ROUTES PROJETS ============

app.get('/api/projects', (req, res) => {
  db.all('SELECT * FROM projects', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/projects/:id', (req, res) => {
  db.get('SELECT * FROM projects WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Projet non trouvé' });
    res.json(row);
  });
});

app.post('/api/projects', (req, res) => {
  const { name, code } = req.body;
  const id = uuidv4();
  
  db.run(
    'INSERT INTO projects (id, name, code) VALUES (?, ?, ?)',
    [id, name, code],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, name, code });
    }
  );
});

app.patch('/api/projects/:id', (req, res) => {
  const { status, market_value, purchases, labor } = req.body;
  const margin = (market_value || 0) - (purchases || 0) - (labor || 0);
  
  db.run(
    'UPDATE projects SET status = ?, market_value = ?, purchases = ?, labor = ?, margin = ? WHERE id = ?',
    [status, market_value, purchases, labor, margin, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// ============ ROUTES MARCHÉ ============

app.get('/api/projects/:projectId/market', (req, res) => {
  db.all('SELECT * FROM market_items WHERE project_id = ?', [req.params.projectId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/projects/:projectId/market', (req, res) => {
  const { type, name, value } = req.body;
  const id = uuidv4();
  
  db.run(
    'INSERT INTO market_items (id, project_id, type, name, value) VALUES (?, ?, ?, ?, ?)',
    [id, req.params.projectId, type, name, value],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, type, name, value });
    }
  );
});

app.delete('/api/market/:id', (req, res) => {
  db.run('DELETE FROM market_items WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ============ ROUTES DÉPENSES ============

app.get('/api/projects/:projectId/expenses', (req, res) => {
  db.all('SELECT * FROM expenses WHERE project_id = ?', [req.params.projectId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/projects/:projectId/expenses', (req, res) => {
  const { type, name, value, description } = req.body;
  const id = uuidv4();
  
  db.run(
    'INSERT INTO expenses (id, project_id, type, name, value, description) VALUES (?, ?, ?, ?, ?, ?)',
    [id, req.params.projectId, type, name, value, description],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id, type, name, value });
    }
  );
});

app.delete('/api/expenses/:id', (req, res) => {
  db.run('DELETE FROM expenses WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ============ ROUTES DOCUMENTS ============

app.get('/api/projects/:projectId/documents', (req, res) => {
  db.all('SELECT * FROM documents WHERE project_id = ? ORDER BY created_at DESC', 
    [req.params.projectId], 
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.post('/api/projects/:projectId/documents', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier' });
  
  const id = uuidv4();
  const fileType = req.file.mimetype.includes('pdf') ? 'PDF' : 'PHOTO';
  const { chantier, type, fournisseur, montant } = req.body;
  
  db.run(
    'INSERT INTO documents (id, project_id, filename, original_name, file_type, file_size, file_path, chantier, type, fournisseur, montant) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, req.params.projectId, req.file.filename, req.file.originalname, fileType, req.file.size, `/uploads/documents/${req.file.filename}`, chantier, type, fournisseur, montant],
    function(err) {
      if (err) {
        fs.unlinkSync(req.file.path);
        return res.status(500).json({ error: err.message });
      }
      res.json({ 
        id, 
        filename: req.file.originalname, 
        file_type: fileType,
        file_size: req.file.size,
        file_path: `/uploads/documents/${req.file.filename}`,
        chantier, type, fournisseur, montant
      });
    }
  );
});

app.delete('/api/documents/:id', (req, res) => {
  db.get('SELECT file_path FROM documents WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Document non trouvé' });
    
    // Supprimer le fichier
    const filePath = path.join('.', row.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Supprimer de la base de données
    db.run('DELETE FROM documents WHERE id = ?', [req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📱 Ouvrez le navigateur et accédez à http://localhost:${PORT}`);
});
