import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { logout } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import TaskManager from "@/components/TaskManager";
import { LogOut, Database } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export default function Dashboard() {
  const { user, getAuthToken } = useAuth();
  const { toast } = useToast();

  const { data: healthData } = useQuery({
    queryKey: ["/api/health"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    refetchInterval: 30000,
  });

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const isDatabaseConnected = healthData?.database === "connected";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-slate-900">Task Manager</h1>
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${
                  isDatabaseConnected ? "bg-green-500" : "bg-red-500 animate-pulse"
                }`}></div>
                <span className="text-sm text-slate-600">
                  DB: {isDatabaseConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">
                    {user?.displayName?.[0] || user?.email?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
                <span className="text-sm text-slate-700">
                  {user?.displayName || user?.email || "User"}
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <TaskManager />
    </div>
  );
}
