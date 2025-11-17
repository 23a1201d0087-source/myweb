-- Vị trí lưu dữ liệu nhóm: db/menu.db
-- Bảng items: id, name, price, category, image, description, created_at
-- Bảng team: id, name, role

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  category TEXT CHECK(category IN ('food','drink')) NOT NULL,
  image TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT
);
