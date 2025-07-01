import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { type TaskWithOwner } from "@shared/schema";
import { 
  Search, 
  Filter, 
  Share, 
  Edit, 
  Trash2, 
  Calendar,
  User,
  Users,
  Database,
  RefreshCw
} from "lucide-react";
import ShareTaskDialog from "./ShareTaskDialog";

export default function TaskList() {
  const { getAuthToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const { 
    data: tasks, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ["/api/tasks", search],
    queryFn: async () => {
      const token = await getAuthToken();
      const url = search ? `/api/tasks?search=${encodeURIComponent(search)}` : "/api/tasks";
      return getQueryFn({ on401: "throw", token })({ queryKey: [url] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const token = await getAuthToken();
      if (!token) throw new Error("No authentication token");
      await apiRequest("DELETE", `/api/tasks/${taskId}`, undefined, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Success",
        description: "Task deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete task",
        variant: "destructive",
      });
    },
  });

  const handleShare = (taskId: number) => {
    setSelectedTaskId(taskId);
    setShareDialogOpen(true);
  };

  const handleDelete = (taskId: number) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-amber-100 text-amber-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "inprogress":
        return "bg-blue-100 text-blue-800";
      case "todo":
        return "bg-slate-100 text-slate-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-600">Loading tasks...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12 border-2 border-dashed border-red-300 rounded-lg bg-red-50">
            <Database className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Unable to Load Tasks</h3>
            <p className="text-red-600 mb-4">
              {error instanceof Error ? error.message : "Database connection failed"}
            </p>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tasks</CardTitle>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!tasks || tasks.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg">
              <div className="h-12 w-12 text-slate-400 mx-auto mb-4">📝</div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No tasks found</h3>
              <p className="text-slate-600 mb-4">
                {search ? "No tasks match your search criteria." : "Create your first task to get started."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task: TaskWithOwner) => (
                <div
                  key={task.id}
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-slate-900">{task.title}</h3>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status === "inprogress" ? "In Progress" : task.status}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority} Priority
                        </Badge>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-slate-600 mb-3">{task.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-slate-500">
                        {task.dueDate && (
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Due: {formatDate(task.dueDate)}
                          </span>
                        )}
                        <span className="flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          Created by: {task.owner.displayName || task.owner.email}
                        </span>
                        {task.shares && task.shares.length > 0 && (
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            Shared with {task.shares.length} user{task.shares.length === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleShare(task.id)}
                      >
                        <Share className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(task.id)}
                        disabled={deleteTaskMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ShareTaskDialog
        taskId={selectedTaskId}
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
      />
    </>
  );
}
