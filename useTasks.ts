import { useEffect, useState, useCallback } from 'react';
import { supabase, Task, TaskInsert, TaskUpdate } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      setTasks((data as Task[]) ?? []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${user.id}` },
        () => { fetchTasks(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchTasks]);

  async function createTask(payload: TaskInsert): Promise<{ error: string | null }> {
    const { error: err } = await supabase.from('tasks').insert(payload);
    if (err) return { error: err.message };
    return { error: null };
  }

  async function updateTask(id: string, payload: TaskUpdate): Promise<{ error: string | null }> {
    const { error: err } = await supabase.from('tasks').update(payload).eq('id', id);
    if (err) return { error: err.message };
    return { error: null };
  }

  async function deleteTask(id: string): Promise<{ error: string | null }> {
    const { error: err } = await supabase.from('tasks').delete().eq('id', id);
    if (err) return { error: err.message };
    return { error: null };
  }

  return { tasks, loading, error, createTask, updateTask, deleteTask, refetch: fetchTasks };
}
