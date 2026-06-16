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

    CREATE TABLE IF NOT EXISTS merchants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cover_image TEXT,
      description TEXT,
      owner_id TEXT NOT NULL,
      is_shared INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS dishes (
      id TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      image TEXT,
      category TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS group_orders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      merchant TEXT NOT NULL,
      merchant_id TEXT,
      deadline TEXT,
      min_participants INTEGER DEFAULT 0,
      owner_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      finished_at TEXT,
      FOREIGN KEY (owner_id) REFERENCES users(id),
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
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
      dish_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES group_orders(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (dish_id) REFERENCES dishes(id)
    );

    CREATE INDEX IF NOT EXISTS idx_merchants_owner ON merchants(owner_id);
    CREATE INDEX IF NOT EXISTS idx_merchants_shared ON merchants(is_shared);
    CREATE INDEX IF NOT EXISTS idx_dishes_merchant ON dishes(merchant_id);
    CREATE INDEX IF NOT EXISTS idx_dishes_category ON dishes(category);
    CREATE INDEX IF NOT EXISTS idx_group_orders_owner ON group_orders(owner_id);
    CREATE INDEX IF NOT EXISTS idx_group_orders_status ON group_orders(status);
    CREATE INDEX IF NOT EXISTS idx_group_orders_merchant ON group_orders(merchant_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_user ON order_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_dish ON order_items(dish_id);
    CREATE INDEX IF NOT EXISTS idx_participants_order ON participants(order_id);
  `);

  await migrateExistingData(db);
}

async function migrateExistingData(db: Database) {
  try {
    const tableInfo = await db.all("PRAGMA table_info(group_orders)");
    const columnNames = tableInfo.map((col: any) => col.name);

    if (!columnNames.includes('merchant_id')) {
      await db.run('ALTER TABLE group_orders ADD COLUMN merchant_id TEXT');
    }
    if (!columnNames.includes('min_participants')) {
      await db.run('ALTER TABLE group_orders ADD COLUMN min_participants INTEGER DEFAULT 0');
    }

    const orderItemsInfo = await db.all("PRAGMA table_info(order_items)");
    const orderItemColumns = orderItemsInfo.map((col: any) => col.name);

    if (!orderItemColumns.includes('dish_id')) {
      await db.run('ALTER TABLE order_items ADD COLUMN dish_id TEXT');
    }
  } catch (error) {
    console.error('Migration error:', error);
  }
}
