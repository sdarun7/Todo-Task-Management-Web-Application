import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { shareTaskRequestSchema, type ShareTaskRequest } from "@shared/schema";
import { Share, AlertCircle } from "lucide-react";

interface ShareTaskDialogProps {
  taskId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShareTaskDialog({ taskId, open, onOpenChange }: ShareTaskDialogProps) {
  const { getAuthToken } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ShareTaskRequest>({
    resolver: zodResolver(shareTaskRequestSchema),
    defaultValues: {
      taskId: taskId || 0,
      email: "",
      permission: "view",
    },
  });

  // Reset form when dialog opens with new task
  if (taskId && form.getValues().taskId !== taskId) {
    form.reset({
      taskId,
      email: "",
      permission: "view",
    });
    setError(null);
  }

  const shareTaskMutation = useMutation({
    mutationFn: async (data: ShareTaskRequest) => {
      const token = await getAuthToken();
      if (!token) throw new Error("No authentication token");

      const response = await apiRequest("POST", "/api/tasks/share", data, token);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Success",
        description: "Task shared successfully",
      });
      onOpenChange(false);
      form.reset();
      setError(null);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to share task";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ShareTaskRequest) => {
    setError(null);
    shareTaskMutation.mutate(data);
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Share className="h-5 w-5 mr-2" />
            Share Task
          </DialogTitle>
          <DialogDescription>
            Share this task with another user by entering their email address.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="colleague@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="permission"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permission Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select permission" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="view">View Only</SelectItem>
                      <SelectItem value="edit">Can Edit</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={shareTaskMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={shareTaskMutation.isPending}
              >
                {shareTaskMutation.isPending ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border border-white border-t-transparent rounded-full"></div>
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share className="h-4 w-4 mr-2" />
                    Share Task
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
