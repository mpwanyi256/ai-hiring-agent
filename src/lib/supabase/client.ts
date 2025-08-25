import { createBrowserClient } from '@supabase/ssr';
import { app } from '../constants';

export function createClient() {
  // Create a supabase client on the browser with project's credentials
  return createBrowserClient(app.projectRef!, app.anonKey!);
}
