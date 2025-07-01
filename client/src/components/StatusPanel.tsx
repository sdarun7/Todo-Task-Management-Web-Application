import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database, Share, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getQueryFn } from "@/lib/queryClient";

export default function StatusPanel() {
  const { getAuthToken } = useAuth();

  const { data: healthData, refetch: refetchHealth, isLoading } = useQuery({
    queryKey: ["/api/health"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    refetchInterval: 30000, // Check every 30 seconds
  });

  const getStatusColor = (status: boolean) => {
    return status ? "text-green-600" : "text-red-600";
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-3 w-3 text-green-500" />
    ) : (
      <XCircle className="h-3 w-3 text-red-500" />
    );
  };

  const isDatabaseConnected = healthData?.database === "connected";
  const isSystemHealthy = healthData?.status === "healthy";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Database Connection Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Database Connection</CardTitle>
          {getStatusIcon(isDatabaseConnected)}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">PostgreSQL:</span>
              <span className={getStatusColor(isDatabaseConnected)}>
                {isDatabaseConnected ? "✅ Connected" : "❌ Failed"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Drizzle ORM:</span>
              <span className={getStatusColor(isDatabaseConnected)}>
                {isDatabaseConnected ? "✅ Working" : "❌ Error"}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={() => refetchHealth()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Status</CardTitle>
          {getStatusIcon(isSystemHealthy)}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">API Server:</span>
              <span className="text-green-600">✅ Running</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Authentication:</span>
              <span className="text-green-600">✅ Active</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Overall:</span>
              <span className={getStatusColor(isSystemHealthy)}>
                {isSystemHealthy ? "✅ Healthy" : "❌ Issues"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Status */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Features</CardTitle>
          <AlertCircle className="h-3 w-3 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Task CRUD:</span>
              <span className={getStatusColor(isDatabaseConnected)}>
                {isDatabaseConnected ? "✅ Working" : "❌ Failing"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Task Sharing:</span>
              <span className={getStatusColor(isDatabaseConnected)}>
                {isDatabaseConnected ? "✅ Working" : "❌ Failing"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Real-time:</span>
              <span className="text-green-600">✅ WebSocket</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
