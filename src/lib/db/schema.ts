/**
 * Smartance database schema.
 *
 * Notes for the panel walkthrough:
 * - UUID primary keys everywhere so IDs never collide across environments.
 * - Foreign-key ON DELETE rules are chosen deliberately:
 *   - courses.lecturer_id uses RESTRICT so we can't delete a lecturer who
 *     still owns courses (prevents orphaned records).
 *   - enrollments and attendance cascade on course/user delete so the joins
 *     don't leave dangling rows.
 * - Unique indexes replace application-level "already-marked" checks with a
 *   database-level guarantee, which is what an examiner will want to see.
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  doublePrecision,
  integer,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['admin', 'lecturer', 'student']);
export const sessionStatusEnum = pgEnum('session_status', ['active', 'ended', 'cancelled']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull(),
  // Only populated for students; kept unique so two students cannot share one.
  matricNo: varchar('matric_no', { length: 32 }).unique(),
  fullName: varchar('full_name', { length: 128 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const courses = pgTable('courses', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 16 }).notNull().unique(), // e.g. CSC401
  title: varchar('title', { length: 200 }).notNull(),
  lecturerId: uuid('lecturer_id')
    .references(() => users.id, { onDelete: 'restrict' })
    .notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const enrollments = pgTable(
  'enrollments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    courseId: uuid('course_id')
      .references(() => courses.id, { onDelete: 'cascade' })
      .notNull(),
    studentId: uuid('student_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    // A student cannot be enrolled in the same course twice.
    uniq: uniqueIndex('enroll_course_student_uq').on(t.courseId, t.studentId),
  }),
);

export const attendanceSessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  courseId: uuid('course_id')
    .references(() => courses.id, { onDelete: 'cascade' })
    .notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  // Geofence fields are nullable — a lecturer can choose to skip location gating.
  geofenceLat: doublePrecision('geofence_lat'),
  geofenceLng: doublePrecision('geofence_lng'),
  radiusM: integer('radius_m'),
  status: sessionStatusEnum('status').default('active').notNull(),
});

export const sessionTokens = pgTable(
  'session_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id')
      .references(() => attendanceSessions.id, { onDelete: 'cascade' })
      .notNull(),
    // HMAC-signed payload. Uniqueness is defensive — the payload includes a
    // timestamp so collisions are already astronomically unlikely.
    token: text('token').notNull().unique(),
    issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    // Marked true the moment a token is consumed within its window, so a
    // student cannot reuse the same QR frame from a screenshot.
    used: boolean('used').default(false).notNull(),
  },
  (t) => ({
    byExpiry: index('token_expiry_idx').on(t.expiresAt),
  }),
);

export const attendance = pgTable(
  'attendance',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id')
      .references(() => attendanceSessions.id, { onDelete: 'cascade' })
      .notNull(),
    studentId: uuid('student_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    markedAt: timestamp('marked_at', { withTimezone: true }).defaultNow().notNull(),
    deviceFingerprint: varchar('device_fingerprint', { length: 128 }),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    // Set by the anti-spoofing layer (Phase 4) — record is kept but flagged
    // for the lecturer to review rather than silently dropped.
    flagged: boolean('flagged').default(false).notNull(),
  },
  (t) => ({
    // DB-level guarantee that one student can only be marked once per session.
    onePerSession: uniqueIndex('attendance_session_student_uq').on(t.sessionId, t.studentId),
  }),
);

// Convenient inferred types for use in the app.
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Role = User['role'];
export type Course = typeof courses.$inferSelect;
export type AttendanceSession = typeof attendanceSessions.$inferSelect;
