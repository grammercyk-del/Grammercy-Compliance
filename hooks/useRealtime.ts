'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Compliance, Alert, UserProfile } from '@/types/database';

// Hook for real-time compliances
export function useCompliances() {
  const [compliances, setCompliances] = useState<Compliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch
    fetchCompliances();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('compliances-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'compliances' },
        (payload) => {
          console.log('Real-time update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setCompliances(prev => [...prev, payload.new as Compliance]);
          } else if (payload.eventType === 'UPDATE') {
            setCompliances(prev =>
              prev.map(c => c.id === payload.new.id ? payload.new as Compliance : c)
            );
          } else if (payload.eventType === 'DELETE') {
            setCompliances(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchCompliances() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('compliances')
        .select(`
          *,
          owner:user_profiles(id, full_name, email)
        `)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setCompliances(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function addCompliance(data: any) {
    const { data: newCompliance, error } = await supabase
      .from('compliances')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return newCompliance;
  }

  async function updateCompliance(id: string, updates: any) {
    const { data, error } = await supabase
      .from('compliances')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async function deleteCompliance(id: string) {
    const { error } = await supabase
      .from('compliances')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  return {
    compliances,
    loading,
    error,
    addCompliance,
    updateCompliance,
    deleteCompliance,
    refresh: fetchCompliances,
  };
}

// Hook for real-time alerts
export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();

    const channel = supabase
      .channel('alerts-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAlerts(prev => [...prev, payload.new as Alert]);
          } else if (payload.eventType === 'UPDATE') {
            setAlerts(prev =>
              prev.map(a => a.id === payload.new.id ? payload.new as Alert : a)
            );
          } else if (payload.eventType === 'DELETE') {
            setAlerts(prev => prev.filter(a => a.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchAlerts() {
    setLoading(true);
    const { data } = await supabase
      .from('alerts')
      .select(`
        *,
        compliance:compliances(*)
      `)
      .order('created_at', { ascending: false });

    setAlerts(data || []);
    setLoading(false);
  }

  async function acknowledgeAlert(id: string) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('alerts')
      .update({
        acknowledged: true,
        acknowledged_by: user?.id,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  }

  return {
    alerts,
    loading,
    acknowledgeAlert,
    unacknowledgedCount: alerts.filter(a => !a.acknowledged).length,
  };
}

// Hook for current user profile
export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }

  const canEdit = profile?.role === 'kipl_admin' || 
                  profile?.role === 'kipl_user' || 
                  profile?.role === 'super_admin';

  const isKIPL = profile?.organization === 'KIPL';

  return {
    profile,
    loading,
    canEdit,
    isKIPL,
    refresh: fetchProfile,
  };
}
