import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dkrpawmussqqbjlrvasz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcnBhd211c3NxcWJqbHJ2YXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NjEzNzQsImV4cCI6MjA2MjAzNzM3NH0.x8OzmvX6-CUvtyeq3yEZ_MUzsedCCLHY-g8qeCYAAcA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
