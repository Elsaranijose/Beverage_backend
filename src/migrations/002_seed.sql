-- ============================================================
-- Beverage Vault — Seed Data (run AFTER after 001_schema.sql)
-- Admin password is set by: npm run seed  (bcrypt hash)
-- This SQL seeds vaults, varieties, cocktail categories, videos
-- ============================================================

USE beverage_vault;

-- Vaults
INSERT INTO vaults (id, `key`, name, description, hero_image, sort_order, status) VALUES
('v-spirits', 'spirits', 'Spirits', 'Learn every spirit from beginner to expert.', '/images/hero/stage-02-liquid.jpg', 1, 'published'),
('v-wine', 'wine', 'Wine', 'Regions, grapes, and tasting foundations.', '/images/wine/editorial-cover.jpg', 2, 'published'),
('v-beer', 'beer', 'Beer', 'Styles, brewing, and serve culture.', '/images/hero/stage-03-ice.jpg', 3, 'published'),
('v-coffee', 'coffee', 'Coffee', 'Origins, roast, and espresso craft.', '/images/hero/stage-01-glass.jpg', 4, 'published'),
('v-tea', 'tea', 'Tea', 'Leaves, steeping, and ritual.', '/images/hero/champagne-alt.jpg', 5, 'published'),
('v-mocktails', 'mocktails', 'Mocktails', 'Zero-proof serves with full technique.', '/images/hero/stage-04-finish.jpg', 6, 'published'),
('v-ingredients', 'ingredients', 'Ingredients', 'Bitters, syrups, citrus, and garnish.', '/images/hero/bar-tools.jpg', 7, 'published');

-- Spirits varieties
INSERT INTO varieties (id, vault_id, slug, name, description, image, coming_soon, status, sort_order) VALUES
('vr-gin', 'v-spirits', 'gin', 'Gin', 'Botanicals, styles, and serve traditions.', '/images/hero/stage-01-glass.jpg', 1, 'published', 1),
('vr-whisky', 'v-spirits', 'whisky', 'Whisky', 'Regions, casks, and tasting foundations.', '/images/hero/stage-03-ice.jpg', 1, 'published', 2),
('vr-rum', 'v-spirits', 'rum', 'Rum', 'Styles from light to aged and agricole.', '/images/hero/stage-04-finish.jpg', 1, 'published', 3),
('vr-vodka', 'v-spirits', 'vodka', 'Vodka', 'Production, purity, and modern serves.', '/images/hero/bar-tools.jpg', 1, 'published', 4),
('vr-tequila', 'v-spirits', 'tequila', 'Tequila', 'Agave, categories, and classic builds.', '/images/hero/glass-caustics.jpg', 1, 'published', 5),
('vr-mezcal', 'v-spirits', 'mezcal', 'Mezcal', 'Smoke, terroir, and ritual tasting.', '/images/hero/cinematic-vault.jpg', 1, 'published', 6),
('vr-brandy', 'v-spirits', 'brandy', 'Brandy', 'Fruit spirits and aging traditions.', '/images/hero/champagne-alt.jpg', 1, 'published', 7),
('vr-cognac', 'v-spirits', 'cognac', 'Cognac', 'Grands crus and luxury serves.', '/images/wine/editorial-cover.jpg', 1, 'published', 8);

-- Wine varieties (sample)
INSERT INTO varieties (id, vault_id, slug, name, description, image, coming_soon, status, sort_order) VALUES
('vr-red', 'v-wine', 'red', 'Red Wine', 'Structure, tannin, and pairing.', '/images/wine/editorial-cover.jpg', 1, 'published', 1),
('vr-white', 'v-wine', 'white', 'White Wine', 'Acidity, aroma, and service.', '/images/hero/champagne-alt.jpg', 1, 'published', 2),
('vr-sparkling', 'v-wine', 'sparkling', 'Sparkling', 'Methode and modern bubbles.', '/images/hero/glass-caustics.jpg', 1, 'published', 3);

-- Cocktail category cards
INSERT INTO cocktail_categories (id, slug, name, description, image, href, count, coming_soon, sort_order) VALUES
('cc-basics', 'cocktail-basics', 'Cocktail Basics', 'Foundations of balance, tools, and bar craft.', '/images/hero/bar-tools.jpg', '#', 12, 1, 1),
('cc-classic', 'classic-cocktails', 'Classic Cocktails', 'The world''s most iconic recipes, studied in depth.', '/images/cocktails/editorial-cover.jpg', '/cocktails/classic', 90, 0, 2),
('cc-modern', 'modern-cocktails', 'Modern Cocktails', 'Contemporary craft and creative techniques.', '/images/cocktails/gin-tonic.jpg', '#', 18, 1, 3),
('cc-signature', 'signature-cocktails', 'Signature Cocktails', 'House originals and chef-driven creations.', '/images/hero/stage-04-finish.jpg', '/signature-cocktails', 10, 0, 4),
('cc-tiki', 'tiki-cocktails', 'Tiki Cocktails', 'Tropical layers, rum, and theatrical garnish.', '/images/hero/stage-02-liquid.jpg', '#', 14, 1, 5);

-- Sample articles
INSERT INTO articles (id, title, excerpt, category, image, href, published_at, read_time, featured, author, status) VALUES
('art-negroni', 'The History of Negroni', 'Discover the origin of the world''s most iconic cocktail.', 'Cocktails', '/images/articles/negroni-story.jpg', '/articles', '2024-06-12', '6 min read', 1, 'Isabelle Marlowe', 'published'),
('art-wine', 'How to Taste Wine Like a Sommelier', 'A practical guide to aroma, palate, and pairing ritual.', 'Wine', '/images/wine/editorial-cover.jpg', '/articles', '2024-06-08', '8 min read', 1, 'Marcus Chen', 'published');

-- Videos (Instagram URL only)
INSERT INTO videos (id, title, thumbnail, instagram_url, category, description, featured, status) VALUES
('vid-negroni', 'How to Stir a Perfect Negroni', '/images/articles/negroni-story.jpg', 'https://www.instagram.com/reel/', 'Cocktails', 'Technique reel — chill, stir, strain.', 1, 'published'),
('vid-gin', 'Tasting Gin Like a Pro', '/images/hero/stage-01-glass.jpg', 'https://www.instagram.com/reel/', 'Spirits', 'Nose, palate, and finish in sixty seconds.', 1, 'published');

-- Settings
INSERT INTO settings (id, site_name, tagline, homepage_json) VALUES
('settings-1', 'The Beverage Vault', 'Learn • Explore • Master the World of Beverage', JSON_OBJECT('featuredVideoIds', JSON_ARRAY('vid-negroni', 'vid-gin')));
