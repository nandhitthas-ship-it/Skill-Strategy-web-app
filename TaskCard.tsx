import { Task, TaskStatus, TaskPriority } from '@/lib/supabase';
import { Calendar, Edit2, Trash2, Circle, Clock, Eye, CheckCircle2 } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
}

const STATUS_META: Record<TaskStatus, { label: string; icon: typeof Circle; color: string; dot: string }> = {
  todo: { label: 'To Do', icon: Circle, color: 'text-slate-400', dot: 'bg-slate-400' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'text-blue-400', dot: 'bg-blue-400' },
  review: { label: 'Review', icon: Eye, color: 'text-amber-400', dot: 'bg-amber-400' },
  done: { label: 'Done', icon: CheckCircle2, color: 'text-emerald-400', dot: 'bg-emerald-400' },
};

const PRIORITY_META: Record<TaskPriority, { label: string; color: string; border: string }> = {
  low: { label: 'Low', color: 'text-slate-400 bg-slate-500/10', border: 'border-slate-500/30' },
  medium: { label: 'Medium', color: 'text-blue-400 bg-blue-500/10', border: 'border-blue-500/30' },
  high: { label: 'High', color: 'text-orange-400 bg-orange-500/10', border: 'border-orange-500/30' },
  critical: { label: 'Critical', color: 'text-red-400 bg-red-500/10', border: 'border-red-500/30' },
};

function isOverdue(due: string | null, status: TaskStatus): boolean {
  if (!due || status === 'done') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(due) < today;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const statusMeta = STATUS_META[task.status];
  const priorityMeta = PRIORITY_META[task.priority];
  const StatusIcon = statusMeta.icon;
  const overdue = isOverdue(task.due_date, task.status);

  return (
    <div
      className={`group bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5 hover:border-slate-600 transition-all duration-200 hover:shadow-xl hover:shadow-black/20 ${
        task.status === 'done' ? 'opacity-75' : ''
      }`}
    >
      {/* Top row: status + priority */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${statusMeta.color}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {statusMeta.label}
        </span>
        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${priorityMeta.color} border ${priorityMeta.border}`}>
          {priorityMeta.label}
        </span>
      </div>

      {/* Title */}
      <h3 className={`text-white font-semibold text-base mb-1 ${task.status === 'done' ? 'line-through text-slate-500' : ''}`}>
        {task.title}
      </h3>

      {/* Description */}
      {task.description && (
        <p className="text-slate-400 text-sm mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Category */}
      <span className="inline-block text-[11px] font-medium text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md mb-3">
        {task.category}
      </span>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {task.tags.map((tag, i) => (
            <span key={i} className="text-[10px] text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
        <div className="flex items-center gap-1.5 text-xs">
          {task.due_date && (
            <span className={`inline-flex items-center gap-1 ${overdue ? 'text-red-400' : 'text-slate-500'}`}>
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(task.due_date)}
              {overdue && <span className="font-semibold">· overdue</span>}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 rounded-lg transition-all"
            aria-label="Edit task"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-all"
            aria-label="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
