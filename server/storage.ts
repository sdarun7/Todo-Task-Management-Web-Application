import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and, or, desc, ilike } from "drizzle-orm";
import { 
  users, 
  tasks, 
  taskShares,
  type User, 
  type InsertUser, 
  type Task,
  type InsertTask,
  type UpdateTask,
  type TaskWithOwner,
  type InsertTaskShare,
  type TaskShare
} from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Task operations
  getTaskById(id: number): Promise<TaskWithOwner | undefined>;
  getTasksByUserId(userId: number, search?: string): Promise<TaskWithOwner[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, userId: number, updates: UpdateTask): Promise<Task>;
  deleteTask(id: number, userId: number): Promise<boolean>;
  
  // Task sharing operations
  shareTask(taskShare: InsertTaskShare): Promise<TaskShare>;
  getTaskShares(taskId: number): Promise<(TaskShare & { sharedWith: User })[]>;
  removeTaskShare(taskId: number, sharedWithId: number): Promise<boolean>;
  getUserSharedTasks(userId: number): Promise<TaskWithOwner[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getTaskById(id: number): Promise<TaskWithOwner | undefined> {
    // First get the task with owner
    const taskResult = await db
      .select()
      .from(tasks)
      .leftJoin(users, eq(tasks.ownerId, users.id))
      .where(eq(tasks.id, id))
      .limit(1);

    if (taskResult.length === 0) return undefined;

    const task = taskResult[0].tasks;
    const owner = taskResult[0].users!;

    // Then get the shares separately
    const sharesResult = await db
      .select()
      .from(taskShares)
      .leftJoin(users, eq(taskShares.sharedWithId, users.id))
      .where(eq(taskShares.taskId, id));

    const shares = sharesResult.map(r => ({
      ...r.task_shares,
      sharedWith: r.users!
    }));

    return { ...task, owner, shares };
  }

  async getTasksByUserId(userId: number, search?: string): Promise<TaskWithOwner[]> {
    // Build query
    let query = db
      .select()
      .from(tasks)
      .leftJoin(users, eq(tasks.ownerId, users.id));

    if (search) {
      query = query.where(
        and(
          eq(tasks.ownerId, userId),
          or(
            ilike(tasks.title, `%${search}%`),
            ilike(tasks.description, `%${search}%`)
          )
        )
      );
    } else {
      query = query.where(eq(tasks.ownerId, userId));
    }

    const tasksResult = await query.orderBy(desc(tasks.createdAt));
    
    // For each task, get its shares
    const tasksWithShares: TaskWithOwner[] = [];
    
    for (const row of tasksResult) {
      const task = row.tasks;
      const owner = row.users!;
      
      // Get shares for this task
      const sharesResult = await db
        .select()
        .from(taskShares)
        .leftJoin(users, eq(taskShares.sharedWithId, users.id))
        .where(eq(taskShares.taskId, task.id));

      const shares = sharesResult.map(shareRow => ({
        ...shareRow.task_shares,
        sharedWith: shareRow.users!
      }));

      tasksWithShares.push({ ...task, owner, shares });
    }
    
    return tasksWithShares;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const result = await db.insert(tasks).values({
      ...task,
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateTask(id: number, userId: number, updates: UpdateTask): Promise<Task> {
    const result = await db
      .update(tasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(tasks.id, id), eq(tasks.ownerId, userId)))
      .returning();
    
    if (result.length === 0) {
      throw new Error("Task not found or access denied");
    }
    
    return result[0];
  }

  async deleteTask(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.ownerId, userId)))
      .returning();
    
    return result.length > 0;
  }

  async shareTask(taskShare: InsertTaskShare): Promise<TaskShare> {
    const result = await db.insert(taskShares).values(taskShare).returning();
    return result[0];
  }

  async getTaskShares(taskId: number): Promise<(TaskShare & { sharedWith: User })[]> {
    const result = await db
      .select()
      .from(taskShares)
      .leftJoin(users, eq(taskShares.sharedWithId, users.id))
      .where(eq(taskShares.taskId, taskId));

    return result.map(row => ({
      ...row.task_shares,
      sharedWith: row.users!
    }));
  }

  async removeTaskShare(taskId: number, sharedWithId: number): Promise<boolean> {
    const result = await db
      .delete(taskShares)
      .where(and(eq(taskShares.taskId, taskId), eq(taskShares.sharedWithId, sharedWithId)))
      .returning();
    
    return result.length > 0;
  }

  async getUserSharedTasks(userId: number): Promise<TaskWithOwner[]> {
    const result = await db
      .select()
      .from(taskShares)
      .leftJoin(tasks, eq(taskShares.taskId, tasks.id))
      .leftJoin(users, eq(tasks.ownerId, users.id))
      .where(eq(taskShares.sharedWithId, userId))
      .orderBy(desc(tasks.createdAt));

    return result.map(row => ({
      ...row.tasks!,
      owner: row.users!,
      shares: []
    }));
  }
}

export const storage = new DatabaseStorage();
