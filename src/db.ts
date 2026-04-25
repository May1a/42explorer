import { Database } from "bun:sqlite";

const db = new Database(process.env.DB_PATH ?? "data.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id         TEXT    PRIMARY KEY,
    access_token  TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at INTEGER NOT NULL,
    user_data  TEXT    NOT NULL DEFAULT '{}',
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
`);

// Clean up sessions older than 7 days on startup
db.prepare(`DELETE FROM sessions WHERE created_at < unixepoch() - 604800`).run();

export interface Session {
  id: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: number;
  user_data: Record<string, any>;
  created_at: number;
}

export function createSession(
  data: Omit<Session, "id" | "created_at">
): string {
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO sessions (id, access_token, refresh_token, token_expires_at, user_data)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    id,
    data.access_token,
    data.refresh_token ?? null,
    data.token_expires_at,
    JSON.stringify(data.user_data)
  );
  return id;
}

export function getSession(id: string): Session | null {
  const row = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(id) as any;
  if (!row) return null;
  return { ...row, user_data: JSON.parse(row.user_data ?? "{}") };
}

export function updateSession(
  id: string,
  data: Partial<
    Pick<Session, "access_token" | "refresh_token" | "token_expires_at" | "user_data">
  >
) {
  const fields: string[] = [];
  const values: any[] = [];
  if (data.access_token !== undefined) {
    fields.push("access_token = ?");
    values.push(data.access_token);
  }
  if (data.refresh_token !== undefined) {
    fields.push("refresh_token = ?");
    values.push(data.refresh_token);
  }
  if (data.token_expires_at !== undefined) {
    fields.push("token_expires_at = ?");
    values.push(data.token_expires_at);
  }
  if (data.user_data !== undefined) {
    fields.push("user_data = ?");
    values.push(JSON.stringify(data.user_data));
  }
  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE sessions SET ${fields.join(", ")} WHERE id = ?`).run(...values);
}

export function deleteSession(id: string) {
  db.prepare(`DELETE FROM sessions WHERE id = ?`).run(id);
}
