const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // clé "service_role", pas la clé publique
);

async function uploadToSupabase(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `${crypto.randomUUID()}${ext}`;

  const { error } = await supabase.storage
    .from('portail-uploads')
    .upload(filename, file.buffer, { contentType: file.mimetype });

  if (error) throw error;

  const { data } = supabase.storage.from('portail-uploads').getPublicUrl(filename);
  return data.publicUrl; // URL complète, ex: https://xxx.supabase.co/storage/v1/object/public/...
}

module.exports = { uploadToSupabase };