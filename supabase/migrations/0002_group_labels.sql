-- Free-text labels for what "A" and "B" actually mean in a given session
-- (e.g. A = "recette actuelle", B = "recette modifiée"), set at session
-- creation/edit time from either the main app's admin panel or the
-- Inscription form's Réglages dialog.
alter table sessions add column if not exists label_a text;
alter table sessions add column if not exists label_b text;
