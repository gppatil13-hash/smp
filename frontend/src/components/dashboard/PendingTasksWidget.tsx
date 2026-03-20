'use client';

import React, { useEffect, useState } from 'react';
import { CheckSquare, AlertCircle, Clock } from 'lucide-react';
import DashboardAPI from '@/services/dashboard.service';

interface Task {
  id: string;
  type: string;
  targetId: string;
  targetName: string;
  description: string;
  daysSincePending: number;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

interface PendingTasksWidgetProps {
  schoolId: string;
}

const PendingTasksWidget: React.FC<PendingTasksWidgetProps> = ({ schoolId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingTasks();
  }, [schoolId]);

  const loadPendingTasks = async () => {
    try {
      setLoading(true);
      const data = await DashboardAPI.getPendingTasks(schoolId);
      setTasks(data.pendingFollowUps || []);
    } catch (error) {
      console.error('Error loading pending tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string): string => {
    const colorMap: { [key: string]: string } = {
      low: 'bg-blue-100 text-blue-700',
      medium: 'bg-orange-100 text-orange-700',
      high: 'bg-red-100 text-red-700',
    };
    return colorMap[priority] || colorMap.low;
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'pending_enquiry':
        return <AlertCircle className="h-5 w-5" />;
      case 'fee_follow_up':
        return <Clock className="h-5 w-5" />;
      default:
        return <CheckSquare className="h-5 w-5" />;
    }
  };

  const getTaskLabel = (type: string): string => {
    const labelMap: { [key: string]: string } = {
      pending_enquiry: 'Pending Enquiry',
      fee_follow_up: 'Fee Follow-up',
      incomplete_documents: 'Incomplete Documents',
    };
    return labelMap[type] || type;
  };

  if (loading) {
    return (
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 w-full animate-pulse rounded bg-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-orange-100 p-3">
            <Clock className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Follow-up Tasks
            </h3>
            <p className="text-sm text-gray-600">
              {tasks.length} pending actions
            </p>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 text-gray-400">{getTaskIcon(task.type)}</div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {task.targetName}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {getTaskLabel(task.type)}
                      </p>
                    </div>
                    <span
                      className={`ml-2 inline-block whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${getPriorityColor(
                        task.priority,
                      )}`}
                    >
                      {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'}{' '}
                      {task.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Pending for {task.daysSincePending} days
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">
            <CheckSquare className="mx-auto h-8 w-8 text-green-600 mb-2 opacity-50" />
            <p>All caught up! No pending tasks.</p>
          </div>
        )}
      </div>

      {/* Footer Link */}
      {tasks.length > 0 && (
        <a
          href="#"
          className="block text-center pt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          View All Tasks →
        </a>
      )}
    </div>
  );
};

export default PendingTasksWidget;
