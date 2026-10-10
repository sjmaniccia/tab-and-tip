-- Migration number: 0002 	 2026-10-09T20:11:38.859Z
-- 0002: indexes for the lookups the site does most
CREATE INDEX idx_reviews_status_date ON reviews (status, visit_date DESC);
CREATE INDEX idx_reviews_cuisine     ON reviews (cuisine);
CREATE INDEX idx_reviews_hood        ON reviews (hood);

