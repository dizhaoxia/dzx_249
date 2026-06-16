import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { config } from '../config';
import path from 'path';

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (db) return db;

  const dbPath = path.resolve(config.dbPath);
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await initDatabase(db);
  return db;
}

async function initDatabase(db: Database) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS group_orders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      merchant TEXT NOT NULL,
      deadline TEXT,
      owner_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      finished_at TEXT,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS participants (
      order_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      joined_at TEXT NOT NULL,
      PRIMARY KEY (order_id, user_id),
      FOREIGN KEY (order_id) REFERENCES group_orders(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      dish_name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES group_orders(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_group_orders_owner ON group_orders(owner_id);
    CREATE INDEX IF NOT EXISTS idx_group_orders_status ON group_orders(status);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_user ON order_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_participants_order ON participants(order_id);
  `);
}
