const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 9901;

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Ensure folders
const pdfsDir = path.join(__dirname, 'public', 'pdfs');
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(pdfsDir)) fs.mkdirSync(pdfsDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer untuk upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const name = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, name);
  }
});
const upload = multer({ storage: storage, fileFilter: (req, file, cb) => {
  if (file.mimetype !== 'application/pdf') return cb(new Error('Only PDFs allowed'), false);
  cb(null, true);
}});

// Upload endpoint
app.post('/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');
  const target = path.join(pdfsDir, req.file.filename);
  fs.rename(req.file.path, target, (err) => {
    if (err) return res.status(500).send('Failed to move file');
    res.redirect('/?pdf=' + encodeURIComponent('pdfs/' + req.file.filename));
  });
});

// List PDF API
app.get('/api/pdfs', (req, res) => {
  fs.readdir(pdfsDir, (err, files) => {
    if (err) return res.json([]);
    const pdfs = files.filter(f => f.toLowerCase().endsWith('.pdf')).map(f => 'pdfs/' + f);
    res.json(pdfs);
  });
});

// Start server
app.listen(port, () => {
  console.log(`e-magazine server running at http://localhost:${port}`);
});