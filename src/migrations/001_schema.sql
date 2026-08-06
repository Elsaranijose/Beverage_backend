-- ============================================================
-- Beverage Vault — MySQL Schema (MySQL Workbench)
-- Database: beverage_vault
-- Run in Workbench: File > Run SQL Script  OR  execute selected
-- ============================================================

CREATE DATABASE IF NOT EXISTS beverage_vault
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE beverage_vault;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS homepage_sections;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS images;
DROP TABLE IF EXISTS videos;
DROP TABLE IF EXISTS signature_cocktails;
DROP TABLE IF EXISTS classic_cocktails;
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS cocktail_categories;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS varieties;
DROP TABLE IF EXISTS vaults;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------
CREATE TABLE users (
  id              CHAR(36)       NOT NULL PRIMARY KEY,
  email           VARCHAR(255)   NOT NULL UNIQUE,
  password_hash   VARCHAR(255)   NOT NULL,
  full_name       VARCHAR(150)   NOT NULL,
  role            ENUM('ADMIN','USER') NOT NULL DEFAULT 'USER',
  date_of_birth   DATE           NULL,
  age_confirmed   TINYINT(1)     NOT NULL DEFAULT 0,
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- vaults  (Spirits, Wine, Beer, Coffee, Tea, Mocktails, Ingredients)
-- ------------------------------------------------------------
CREATE TABLE vaults (
  id              CHAR(36)       NOT NULL PRIMARY KEY,
  `key`           VARCHAR(64)    NOT NULL UNIQUE,
  name            VARCHAR(120)   NOT NULL,
  description     TEXT           NULL,
  hero_image      VARCHAR(500)   NULL,
  sort_order      INT            NOT NULL DEFAULT 0,
  status          ENUM('published','draft','archived') NOT NULL DEFAULT 'published',
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- varieties  (Gin, Whisky under Spirits, etc.)
-- ------------------------------------------------------------
CREATE TABLE varieties (
  id              CHAR(36)       NOT NULL PRIMARY KEY,
  vault_id        CHAR(36)       NOT NULL,
  slug            VARCHAR(120)   NOT NULL,
  name            VARCHAR(150)   NOT NULL,
  description     TEXT           NULL,
  image           VARCHAR(500)   NULL,
  count           INT            NOT NULL DEFAULT 0,
  coming_soon     TINYINT(1)     NOT NULL DEFAULT 1,
  status          ENUM('published','draft','archived') NOT NULL DEFAULT 'published',
  sort_order      INT            NOT NULL DEFAULT 0,
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_variety_vault_slug (vault_id, slug),
  CONSTRAINT fk_variety_vault
    FOREIGN KEY (vault_id) REFERENCES vaults(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- categories  (optional deeper taxonomy under a variety)
-- ------------------------------------------------------------
CREATE TABLE categories (
  id              CHAR(36)       NOT NULL PRIMARY KEY,
  variety_id      CHAR(36)       NOT NULL,
  slug            VARCHAR(120)   NOT NULL,
  name            VARCHAR(150)   NOT NULL,
  description     TEXT           NULL,
  image           VARCHAR(500)   NULL,
  status          ENUM('published','draft','archived') NOT NULL DEFAULT 'published',
  sort_order      INT            NOT NULL DEFAULT 0,
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_category_variety_slug (variety_id, slug),
  CONSTRAINT fk_category_variety
    FOREIGN KEY (variety_id) REFERENCES varieties(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- cocktail landing category cards
-- ------------------------------------------------------------
CREATE TABLE cocktail_categories (
  id              CHAR(36)       NOT NULL PRIMARY KEY,
  slug            VARCHAR(120)   NOT NULL UNIQUE,
  name            VARCHAR(150)   NOT NULL,
  description     TEXT           NULL,
  image           VARCHAR(500)   NULL,
  href            VARCHAR(255)   NOT NULL DEFAULT '#',
  count           INT            NOT NULL DEFAULT 0,
  coming_soon     TINYINT(1)     NOT NULL DEFAULT 1,
  sort_order      INT            NOT NULL DEFAULT 0,
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- articles
-- ------------------------------------------------------------
CREATE TABLE articles (
  id              CHAR(36)       NOT NULL PRIMARY KEY,
  title           VARCHAR(255)   NOT NULL,
  excerpt         TEXT           NOT NULL,
  category        VARCHAR(120)   NOT NULL DEFAULT 'General',
  image           VARCHAR(500)   NULL,
  href            VARCHAR(255)   NOT NULL DEFAULT '/articles',
  published_at    DATE           NULL,
  read_time       VARCHAR(40)    NULL,
  featured        TINYINT(1)     NOT NULL DEFAULT 0,
  author          VARCHAR(150)   NULL,
  status          ENUM('published','draft','archived') NOT NULL DEFAULT 'published',
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- classic_cocktails  (nested recipe fields as JSON for frontend parity)
-- ------------------------------------------------------------
CREATE TABLE classic_cocktails (
  id                    CHAR(36)     NOT NULL PRIMARY KEY,
  slug                  VARCHAR(160) NOT NULL UNIQUE,
  name                  VARCHAR(180) NOT NULL,
  drink_style           VARCHAR(80)  NULL,
  description           TEXT         NULL,
  history               TEXT         NULL,
  origin                VARCHAR(255) NULL,
  interesting_facts     JSON         NULL,
  difficulty            ENUM('Easy','Medium','Advanced') NOT NULL DEFAULT 'Easy',
  preparation_time      VARCHAR(40)  NULL,
  alcohol_percentage    DECIMAL(5,2) NOT NULL DEFAULT 0,
  spirit                VARCHAR(120) NULL,
  glass                 VARCHAR(120) NULL,
  garnish               VARCHAR(255) NULL,
  notes                 TEXT         NULL,
  garnish_image         VARCHAR(500) NULL,
  glass_image           VARCHAR(500) NULL,
  hero_image            VARCHAR(500) NULL,
  thumbnail             VARCHAR(500) NULL,
  gallery               JSON         NULL,
  ingredients           JSON         NULL,
  preparation_steps     JSON         NULL,
  food_pairing          JSON         NULL,
  related_cocktails     JSON         NULL,
  related_articles      JSON         NULL,
  related_videos        JSON         NULL,
  popularity            INT          NOT NULL DEFAULT 50,
  featured              TINYINT(1)   NOT NULL DEFAULT 0,
  status                ENUM('published','draft','archived') NOT NULL DEFAULT 'published',
  division_slug         VARCHAR(120) NOT NULL DEFAULT 'classic-cocktails',
  created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- signature_cocktails
-- ------------------------------------------------------------
CREATE TABLE signature_cocktails (
  id                    CHAR(36)     NOT NULL PRIMARY KEY,
  slug                  VARCHAR(160) NOT NULL UNIQUE,
  title                 VARCHAR(180) NOT NULL,
  tagline               VARCHAR(255) NULL,
  short_story           TEXT         NULL,
  story                 TEXT         NULL,
  hero_image            VARCHAR(500) NULL,
  gallery               JSON         NULL,
  quick_info            JSON         NULL,
  ingredients           JSON         NULL,
  equipment             JSON         NULL,
  preparation_steps     JSON         NULL,
  flavor_profile        JSON         NULL,
  glassware             JSON         NULL,
  garnish               JSON         NULL,
  experience            JSON         NULL,
  bartender_notes       JSON         NULL,
  interesting_facts     JSON         NULL,
  related_cocktails     JSON         NULL,
  featured              TINYINT(1)   NOT NULL DEFAULT 0,
  status                ENUM('published','draft','archived') NOT NULL DEFAULT 'published',
  created_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- videos  (Instagram URL only — no file upload)
-- ------------------------------------------------------------
CREATE TABLE videos (
  id              CHAR(36)       NOT NULL PRIMARY KEY,
  title           VARCHAR(255)   NOT NULL,
  thumbnail       VARCHAR(500)   NOT NULL,
  instagram_url   VARCHAR(500)   NOT NULL,
  category        VARCHAR(120)   NULL,
  description     TEXT           NULL,
  featured        TINYINT(1)     NOT NULL DEFAULT 0,
  status          ENUM('published','draft','archived') NOT NULL DEFAULT 'published',
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- images  (store URL only)
-- ------------------------------------------------------------
CREATE TABLE images (
  id              CHAR(36)       NOT NULL PRIMARY KEY,
  url             VARCHAR(500)   NOT NULL,
  alt_text        VARCHAR(255)   NULL,
  folder          VARCHAR(120)   NULL,
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- settings / homepage sections
-- ------------------------------------------------------------
CREATE TABLE settings (
  id              CHAR(36)       NOT NULL PRIMARY KEY,
  site_name       VARCHAR(150)   NOT NULL DEFAULT 'The Beverage Vault',
  tagline         VARCHAR(255)   NULL,
  homepage_json   JSON           NULL,
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE homepage_sections (
  id              CHAR(36)       NOT NULL PRIMARY KEY,
  section_key     VARCHAR(80)    NOT NULL UNIQUE,
  title           VARCHAR(180)   NULL,
  payload         JSON           NULL,
  sort_order      INT            NOT NULL DEFAULT 0,
  status          ENUM('published','draft','archived') NOT NULL DEFAULT 'published',
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Helpful indexes
CREATE INDEX idx_varieties_vault ON varieties(vault_id);
CREATE INDEX idx_categories_variety ON categories(variety_id);
CREATE INDEX idx_articles_featured ON articles(featured, status);
CREATE INDEX idx_classic_spirit ON classic_cocktails(spirit);
CREATE INDEX idx_classic_status ON classic_cocktails(status);
CREATE INDEX idx_signature_status ON signature_cocktails(status);
CREATE INDEX idx_videos_status ON videos(status);
