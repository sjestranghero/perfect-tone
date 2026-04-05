import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hjllatynavghogrmygmu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqbGxhdHluYXZnaG9ncm15Z211Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyODkwMzYsImV4cCI6MjA5MDg2NTAzNn0.3pjbVO-oJ4WUoVkoG75BKg4dnpl2v9_XbhJGqnaGhxg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)