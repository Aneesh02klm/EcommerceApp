ALTER TABLE StorefrontConfig RENAME COLUMN ConfigJson TO DraftJson;
ALTER TABLE StorefrontConfig ADD COLUMN PublishedJson JSONB;
UPDATE StorefrontConfig SET PublishedJson = DraftJson;
