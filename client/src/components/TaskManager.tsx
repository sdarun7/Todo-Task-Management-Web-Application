import StatusPanel from "./StatusPanel";
import TaskForm from "./TaskForm";
import TaskList from "./TaskList";

export default function TaskManager() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <StatusPanel />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <TaskForm />
          <TaskList />
        </div>
        
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total Tasks:</span>
                <span className="font-medium">-</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Completed:</span>
                <span className="font-medium text-green-600">-</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">In Progress:</span>
                <span className="font-medium text-blue-600">-</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Shared:</span>
                <span className="font-medium text-purple-600">-</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
