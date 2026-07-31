import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { Task, TaskStatus, TaskPriority, TaskInsert, TaskUpdate } from '@/lib/supabase';
import TaskCard from '@/components/TaskCard';
import TaskModal from '@/components/TaskModal';
import {
  Brain, Plus, Search, LogOut, LayoutGrid, List, TrendingUp,
  Circle, Clock, Eye, CheckCircle2, Inbox, AlertTriangle
} from 'lucide-react';

type ViewMode = 'board' | 'list';
type FilterStatus = TaskStatus | 'all';
type FilterPriority = TaskPriority | 'all';

const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_FILTERS: { value: FilterPriority; label: string }[] = [
  { value: 'all', label: 'All Priority' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const COLUMNS: { key: TaskStatus; label: string; icon: typeof Circle; accent: string }[] = [
  { key: 'todo', label: 'To Do', icon: Circle, accent: 'border-slate-500' },
  { key: 'in_progress', label: 'In Progress', icon: Clock, accent: 'border-blue-500' },
  { key: 'review', label: 'Review', icon: Eye, accent: 'border-amber-500' },
  { key: 'done', label: 'Done', icon: CheckCircle2, accent: 'border-emerald-500' },
];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { tasks, loading, error, createTask, updateTask, deleteTask } = useTasks();

  const [view, setView] = useState<ViewMode>('board');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const overdue = tasks.filter((t) => {
      if (!t.due_date || t.status === 'done') return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(t.due_date) < today;
    }).length;
    return { total, done, inProgress, overdue };
  }, [tasks]);

  function openNew() {
    setEditingTask(null);
    setModalOpen(true);
  }
  function openEdit(task: Task) {
    setEditingTask(task);
    setModalOpen(true);
  }
  async function handleSave(payload: TaskInsert | TaskUpdate) {
    if (editingTask) return updateTask(editingTask.id, payload);
    return createTask(payload as TaskInsert);
  }
  async function confirmDelete() {
    if (!deleteId) return;
    await deleteTask(deleteId);
    setDeleteId(null);
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-widest text-blue-400 uppercase leading-none">Thiranex</p>
                <h1 className="text-base font-bold text-white leading-tight">Skill Strategy</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm text-slate-400">
                {user?.email}
              </span>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Tasks" value={stats.total} icon={<Inbox className="w-5 h-5" />} accent="text-blue-400 bg-blue-500/10" />
          <StatCard label="In Progress" value={stats.inProgress} icon={<TrendingUp className="w-5 h-5" />} accent="text-cyan-400 bg-cyan-500/10" />
          <StatCard label="Completed" value={stats.done} icon={<CheckCircle2 className="w-5 h-5" />} accent="text-emerald-400 bg-emerald-500/10" />
          <StatCard label="Overdue" value={stats.overdue} icon={<AlertTriangle className="w-5 h-5" />} accent="text-red-400 bg-red-500/10" />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks, tags, categories..."
              className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as FilterPriority)}
              className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-all"
            >
              {PRIORITY_FILTERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>

            <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-0.5">
              <button
                onClick={() => setView('board')}
                className={`p-2 rounded-lg transition-all ${view === 'board' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                aria-label="Board view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={openNew}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Task</span>
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <span className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl p-6 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onCreate={openNew} hasTasks={tasks.length > 0} />
        ) : view === 'board' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {COLUMNS.map((col) => {
              const colTasks = filtered.filter((t) => t.status === col.key);
              const ColIcon = col.icon;
              return (
                <div key={col.key} className="flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <ColIcon className={`w-4 h-4 ${COLUMNS.find((c) => c.key === col.key)?.accent.replace('border', 'text')}`} />
                    <h3 className="text-sm font-semibold text-white">{col.label}</h3>
                    <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{colTasks.length}</span>
                  </div>
                  <div className="space-y-3 min-h-[100px]">
                    {colTasks.map((task) => (
                      <TaskCard key={task.id} task={task} onEdit={() => openEdit(task)} onDelete={() => setDeleteId(task.id)} />
                    ))}
                    {colTasks.length === 0 && (
                      <div className="border-2 border-dashed border-slate-800 rounded-2xl py-8 text-center text-xs text-slate-600">
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={() => openEdit(task)} onDelete={() => setDeleteId(task.id)} />
            ))}
          </div>
        )}
      </main>

      {/* Task Modal */}
      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        task={editingTask}
        onSave={handleSave}
      />

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative w-full max-w-sm bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Delete this task?</h3>
            <p className="text-sm text-slate-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-2.5 rounded-xl transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-xl transition-all text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onCreate, hasTasks }: { onCreate: () => void; hasTasks: boolean }) {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Inbox className="w-8 h-8 text-slate-600" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">
        {hasTasks ? 'No tasks match your filters' : 'No tasks yet'}
      </h3>
      <p className="text-sm text-slate-500 mb-6">
        {hasTasks ? 'Try adjusting your search or filters.' : 'Create your first task to get started.'}
      </p>
      {!hasTasks && (
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Task
        </button>
      )}
    </div>
  );
}
