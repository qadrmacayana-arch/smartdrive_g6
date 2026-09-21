(function () {
  const config = {
    url: 'https://eykggdvyxbmtgyhwoguu.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5a2dnZHZ5eGJtdGd5aHdvZ3V1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2OTUyNjIsImV4cCI6MjEwNDI3MTI2Mn0.2yAfhGx5kxqF6UQlAUrhFWrq8maX-7iN52ckvgokhSU'
  };

  window.SMARTDRIVE_SUPABASE_CONFIG = config;

  if (!window.supabase) {
    console.warn('Supabase JS SDK not loaded yet. Add the Supabase script before this file.');
    window.smartdriveSupabaseConfigError = 'Supabase SDK failed to load. Check your internet connection or CDN access.';
    window.smartdriveSupabase = null;
    return;
  }

  const hasCustomValues =
    /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.url) &&
    config.anonKey.length > 100 &&
    !config.anonKey.includes('YOUR_');
  window.smartdriveSupabaseConfigError = hasCustomValues
    ? null
    : 'Supabase is not configured. Replace the anon key in js/supabase.js.';
  window.smartdriveSupabase = hasCustomValues ? window.supabase.createClient(config.url, config.anonKey) : null;

  if (!window.smartdriveSupabase) {
    console.warn('Supabase is not configured yet. Update supabase.js with your project URL and anon key.');
  }
})();
