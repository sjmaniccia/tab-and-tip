-- SAMPLE DATA FOR TESTING ONLY.
-- Starts with DELETE FROM reviews, which wipes every review.
-- Safe with --local anytime. NEVER run with --remote once real reviews exist.
DELETE FROM reviews;

INSERT INTO reviews
  (slug, name, cuisine, hood,
   score_food, score_service, score_value, score_atmosphere,
   verdict, visits, paid_cents, visit_date, status)
VALUES
  ('sample-restaurant-a', 'Sample Restaurant A', 'tacos', 'southside',
   80, 70, 65, 60,
   '[One-line verdict.]', 1, 0, '2026-09-28', 'published');
INSERT INTO reviews
  (slug, name, cuisine, hood,
   score_food, score_service, score_value, score_atmosphere,
   verdict, visits, paid_cents, visit_date, status)
VALUES
  ('sample-restaurant-b', 'Sample Restaurant B', 'burgers', 'north-shore',
   50, 50, 50, 50,
   '[One-line verdict.]', 1, 0, '2026-09-14', 'published'),
  ('sample-restaurant-c', 'Sample Restaurant C', 'pizza', 'downtown',
   95, 80, 70, 70,
   '[One-line verdict.]', 1, 0, '2026-10-02', 'published'),
  ('sample-restaurant-d', 'Sample Restaurant D', 'bbq', 'red-bank-hixson',
   70, 60, 50, 70,
   '[One-line verdict.]', 1, 0, '2026-08-30', 'published'),
  ('sample-restaurant-e', 'Sample Restaurant E', 'other', 'downtown',
   30, 40, 40, 55,
   '[One-line verdict.]', 2, 0, '2026-09-21', 'published'),
  ('sample-restaurant-f', 'Sample Restaurant F', 'tacos', 'east-ridge',
   40, 50, 50, 50,
   '[One-line verdict.]', 2, 0, '2026-08-15', 'published'),
  ('sample-restaurant-g', 'Sample Restaurant G', 'pasta', 'st-elmo',
   80, 80, 75, 80,
   '[One-line verdict.]', 1, 0, '2026-07-30', 'published'),
  ('sample-restaurant-h', 'Sample Restaurant H', 'noodles', 'brainerd-hamilton-place',
   65, 50, 60, 50,
   '[One-line verdict.]', 1, 0, '2026-09-05', 'published'),
  ('sample-restaurant-i', 'Sample Restaurant I', 'fried-chicken', 'signal-mountain',
   70, 70, 70, 60,
   '[One-line verdict.]', 1, 0, '2026-10-06', 'draft');
