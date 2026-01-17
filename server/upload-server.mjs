import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = process.env.UPLOAD_SERVER_PORT || 4001;

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL in environment');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const file = req.file;
    const ext = (file.originalname.match(/\.([^.]+)$/) || [])[1] || 'bin';
    const filePath = `products/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error: uploadErr } = await supabaseAdmin.storage
      .from('product-images')
      .upload(filePath, file.buffer, { cacheControl: '3600', upsert: false });

    if (uploadErr) {
      console.error('Upload error', uploadErr);
      return res.status(500).json({ error: uploadErr.message || 'Upload failed' });
    }

    const { data: publicData } = supabaseAdmin.storage.from('product-images').getPublicUrl(data.path);
    return res.json({ publicUrl: publicData.publicUrl });
  } catch (err) {
    console.error('Unexpected error', err);
    return res.status(500).json({ error: String(err) });
  }
});

app.listen(port, () => {
  console.log(`Upload server listening on http://localhost:${port}`);
});
