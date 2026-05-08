import { supabase } from './supabaseClient';

export const api = {
  // Public
  getActiveSheets: async () => {
    const { data, error } = await supabase
      .from('sheets')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  },

  // Auth
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return { token: data.session.access_token };
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error(error.message);
    return data.session;
  },

  getAdminSheets: async () => {
    const { data, error } = await supabase
      .from('sheets')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      if (error.code === 'PGRST301') throw new Error('401 Unauthorized');
      throw new Error(error.message);
    }
    return data || [];
  },

  uploadFile: async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('workbooks')
      .upload(fileName, file);

    if (error) throw new Error(error.message);
    
    const { data } = supabase.storage
      .from('workbooks')
      .getPublicUrl(fileName);
      
    return data.publicUrl;
  },

  addSheet: async (sheet) => {
    const { data, error } = await supabase
      .from('sheets')
      .insert([sheet])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  updateSheet: async (id, updates) => {
    const { id: _, created_at, updated_at, ...cleanUpdates } = updates;
    const { data, error } = await supabase
      .from('sheets')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  deleteSheet: async (id) => {
    const { error } = await supabase
      .from('sheets')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }
};
