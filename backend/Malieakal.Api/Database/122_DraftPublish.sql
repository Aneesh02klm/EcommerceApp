DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'storefrontconfig' 
        AND column_name = 'configjson'
    ) THEN
        ALTER TABLE StorefrontConfig RENAME COLUMN ConfigJson TO DraftJson;
    END IF;
END $$;

ALTER TABLE StorefrontConfig ADD COLUMN IF NOT EXISTS PublishedJson JSONB;

UPDATE StorefrontConfig 
SET PublishedJson = DraftJson 
WHERE PublishedJson IS NULL;
