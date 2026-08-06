-- Add division_slug so Classic / Basics / Modern / Tiki recipes share classic_cocktails.
-- Prefer running via repository ensureSchema() (handles Duplicate column safely).
ALTER TABLE classic_cocktails
  ADD COLUMN division_slug VARCHAR(120) NOT NULL DEFAULT 'classic-cocktails';
