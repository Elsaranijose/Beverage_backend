-- Entries under a vault classification (e.g. Gin bottles / guides under Spirits → Gin)
CREATE TABLE IF NOT EXISTS vault_items (
  id              VARCHAR(80)    NOT NULL PRIMARY KEY,
  variety_id      CHAR(36)       NOT NULL,
  slug            VARCHAR(120)   NOT NULL,
  name            VARCHAR(200)   NOT NULL,
  description     TEXT           NULL,
  image           VARCHAR(500)   NULL,
  notes           TEXT           NULL,
  status          ENUM('published','draft','archived') NOT NULL DEFAULT 'published',
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_vault_item_variety_slug (variety_id, slug),
  CONSTRAINT fk_vault_item_variety
    FOREIGN KEY (variety_id) REFERENCES varieties(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX IF NOT EXISTS idx_vault_items_variety ON vault_items(variety_id);
