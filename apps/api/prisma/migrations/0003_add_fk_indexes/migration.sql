-- Add indexes on foreign key columns for availability_requests, viewings, and favorites.
-- These were missing, causing sequential scans on every per-user query.

CREATE INDEX "availability_requests_user_id_idx" ON "availability_requests"("user_id");
CREATE INDEX "availability_requests_venue_id_idx" ON "availability_requests"("venue_id");

CREATE INDEX "viewings_user_id_idx" ON "viewings"("user_id");
CREATE INDEX "viewings_venue_id_idx" ON "viewings"("venue_id");

CREATE INDEX "favorites_user_id_idx" ON "favorites"("user_id");
CREATE INDEX "favorites_venue_id_idx" ON "favorites"("venue_id");
