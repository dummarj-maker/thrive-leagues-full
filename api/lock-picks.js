import { createClient } from '@supabase/supabase-js';

// Use environment variables from Vercel
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export default async function handler(req, res) {
  try {
    // Lock any picks that are still open
    const { error } = await supabase
      .from('user_week_picks')
      .update({ locked: true })
      .eq('locked', false);

    if (error) throw error;

    res.status(200).json({ success: true, message: 'Picks locked successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
