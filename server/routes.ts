import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { verifyFirebaseToken } from "./firebase-admin";
import { 
  insertTaskSchema, 
  updateTaskSchema, 
  shareTaskRequestSchema,
  insertUserSchema 
} from "@shared/schema";
import { ZodError } from "zod";

// Real-time functionality placeholder - would use WebSockets in production
function broadcastToClients(message: any) {
  // For now, we'll implement real-time updates through polling
  // This avoids WebSocket frame validation issues in development
  console.log('Real-time update:', message);
}

interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    name?: string;
  };
}

// Middleware to verify Firebase token
async function authenticateUser(req: AuthRequest, res: Response, next: Function) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.substring(7);
    const decodedToken = await verifyFirebaseToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email!,
      name: decodedToken.name
    };

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
}

// Get or create user from Firebase auth
async function getOrCreateUser(firebaseUid: string, email: string, displayName?: string) {
  let user = await storage.getUserByFirebaseUid(firebaseUid);
  
  if (!user) {
    user = await storage.createUser({
      firebaseUid,
      email,
      displayName: displayName || null
    });
  }
  
  return user;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/health", async (req, res) => {
    try {
      // Test database connection
      await storage.getUser(1);
      res.json({ status: "healthy", database: "connected" });
    } catch (error) {
      res.status(503).json({ 
        status: "unhealthy", 
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get current user
  app.get("/api/user", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const user = await getOrCreateUser(
        req.user!.uid, 
        req.user!.email, 
        req.user!.name
      );
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Get tasks (owned + shared)
  app.get("/api/tasks", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const user = await getOrCreateUser(req.user!.uid, req.user!.email, req.user!.name);
      const search = req.query.search as string;
      
      const [ownedTasks, sharedTasks] = await Promise.all([
        storage.getTasksByUserId(user.id, search),
        storage.getUserSharedTasks(user.id)
      ]);
      
      const allTasks = [...ownedTasks, ...sharedTasks];
      
      res.json(allTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Get single task
  app.get("/api/tasks/:id", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const user = await getOrCreateUser(req.user!.uid, req.user!.email, req.user!.name);
      
      const task = await storage.getTaskById(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if user owns task or has it shared with them
      const hasAccess = task.ownerId === user.id || 
        task.shares.some(share => share.sharedWithId === user.id);
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  // Create task
  app.post("/api/tasks", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const user = await getOrCreateUser(req.user!.uid, req.user!.email, req.user!.name);
      const taskData = insertTaskSchema.parse({
        ...req.body,
        ownerId: user.id
      });
      
      const task = await storage.createTask(taskData);
      
      // Broadcast real-time update
      broadcastToClients({
        type: 'TASK_CREATED',
        task: task,
        userId: user.id
      });
      
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  // Update task
  app.put("/api/tasks/:id", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const user = await getOrCreateUser(req.user!.uid, req.user!.email, req.user!.name);
      const updates = updateTaskSchema.parse(req.body);
      
      const task = await storage.updateTask(taskId, user.id, updates);
      
      // Broadcast real-time update
      broadcastToClients({
        type: 'TASK_UPDATED',
        task: task,
        userId: user.id
      });
      
      res.json(task);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      if (error instanceof Error && error.message === "Task not found or access denied") {
        return res.status(404).json({ message: error.message });
      }
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Delete task
  app.delete("/api/tasks/:id", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const user = await getOrCreateUser(req.user!.uid, req.user!.email, req.user!.name);
      
      const success = await storage.deleteTask(taskId, user.id);
      
      if (!success) {
        return res.status(404).json({ message: "Task not found or access denied" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Share task
  app.post("/api/tasks/share", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const user = await getOrCreateUser(req.user!.uid, req.user!.email, req.user!.name);
      const shareData = shareTaskRequestSchema.parse(req.body);
      
      // Verify user owns the task
      const task = await storage.getTaskById(shareData.taskId);
      if (!task || task.ownerId !== user.id) {
        return res.status(403).json({ message: "You can only share tasks you own" });
      }
      
      // Find or create user to share with
      let sharedWithUser = await storage.getUserByEmail(shareData.email);
      if (!sharedWithUser) {
        // Create a placeholder user for the email address
        sharedWithUser = await storage.createUser({
          firebaseUid: `placeholder_${Date.now()}_${shareData.email}`,
          email: shareData.email,
          displayName: null
        });
      }
      
      // Check if task is already shared with this user
      const existingShares = await storage.getTaskShares(shareData.taskId);
      const alreadyShared = existingShares.some(share => share.sharedWithId === sharedWithUser.id);
      
      if (alreadyShared) {
        return res.status(400).json({ message: "Task is already shared with this user" });
      }

      // Create task share
      const taskShare = await storage.shareTask({
        taskId: shareData.taskId,
        sharedWithId: sharedWithUser.id,
        permission: shareData.permission
      });
      
      // Broadcast real-time update
      broadcastToClients({
        type: 'TASK_SHARED',
        taskShare: taskShare,
        taskId: shareData.taskId,
        sharedWithEmail: shareData.email,
        userId: user.id
      });
      
      res.status(201).json(taskShare);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid share data", errors: error.errors });
      }
      console.error("Error sharing task:", error);
      res.status(500).json({ message: "Failed to share task" });
    }
  });

  // Get task shares
  app.get("/api/tasks/:id/shares", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const user = await getOrCreateUser(req.user!.uid, req.user!.email, req.user!.name);
      
      // Verify user owns the task
      const task = await storage.getTaskById(taskId);
      if (!task || task.ownerId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const shares = await storage.getTaskShares(taskId);
      res.json(shares);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task shares" });
    }
  });

  // Remove task share
  app.delete("/api/tasks/:id/shares/:userId", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const sharedWithId = parseInt(req.params.userId);
      const user = await getOrCreateUser(req.user!.uid, req.user!.email, req.user!.name);
      
      // Verify user owns the task
      const task = await storage.getTaskById(taskId);
      if (!task || task.ownerId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const success = await storage.removeTaskShare(taskId, sharedWithId);
      if (!success) {
        return res.status(404).json({ message: "Share not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove task share" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
