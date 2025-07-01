import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const taskStatusEnum = pgEnum("task_status", ["todo", "inprogress", "completed"]);
export const taskPriorityEnum = pgEnum("task_priority", ["low", "medium", "high"]);
export const sharePermissionEnum = pgEnum("share_permission", ["view", "edit"]);

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: taskStatusEnum("status").default("todo").notNull(),
  priority: taskPriorityEnum("priority").default("medium").notNull(),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ownerId: integer("owner_id").notNull().references(() => users.id),
});

export const taskShares = pgTable("task_shares", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  sharedWithId: integer("shared_with_id").notNull().references(() => users.id),
  permission: sharePermissionEnum("permission").default("view").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  ownedTasks: many(tasks),
  sharedTasks: many(taskShares),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  owner: one(users, {
    fields: [tasks.ownerId],
    references: [users.id],
  }),
  shares: many(taskShares),
}));

export const taskSharesRelations = relations(taskShares, ({ one }) => ({
  task: one(tasks, {
    fields: [taskShares.taskId],
    references: [tasks.id],
  }),
  sharedWith: one(users, {
    fields: [taskShares.sharedWithId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTaskSchema = insertTaskSchema.partial().omit({
  ownerId: true,
});

export const insertTaskShareSchema = createInsertSchema(taskShares).omit({
  id: true,
  createdAt: true,
});

export const shareTaskRequestSchema = z.object({
  taskId: z.number(),
  email: z.string().email(),
  permission: z.enum(["view", "edit"]),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTaskShare = z.infer<typeof insertTaskShareSchema>;
export type TaskShare = typeof taskShares.$inferSelect;
export type ShareTaskRequest = z.infer<typeof shareTaskRequestSchema>;

export type TaskWithOwner = Task & {
  owner: User;
  shares: (TaskShare & { sharedWith: User })[];
};
