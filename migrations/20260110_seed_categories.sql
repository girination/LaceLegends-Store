-- Seed default categories
INSERT INTO categories (name)
VALUES ('clothing')
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (name)
VALUES ('shoes')
ON CONFLICT (name) DO NOTHING;
