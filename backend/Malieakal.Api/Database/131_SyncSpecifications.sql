-- 131_SyncSpecifications.sql
DO $$
DECLARE
    rec RECORD;
    cat_rec RECORD;
    aggregated_template JSONB;
BEGIN
    -- For each category, we will build a complete specification template
    FOR cat_rec IN SELECT Id FROM Categories LOOP
        -- Start with an empty object
        aggregated_template := '{}'::jsonb;
        
        -- Find all group and name pairs for products in this category
        FOR rec IN 
            SELECT DISTINCT 
                p.CategoryId,
                groups.key AS GroupName,
                fields.key AS FieldName
            FROM Products p,
                 jsonb_each(p.SpecificationJson) AS groups,
                 jsonb_each(groups.value) AS fields
            WHERE p.CategoryId = cat_rec.Id 
              AND p.SpecificationJson IS NOT NULL 
              AND p.SpecificationJson::text != '{}'
        LOOP
            -- Insert into SpecificationDefinitions if missing
            IF NOT EXISTS (SELECT 1 FROM SpecificationDefinitions WHERE GroupName = rec.GroupName AND Name = rec.FieldName) THEN
                INSERT INTO SpecificationDefinitions (GroupName, Name, DataType, IsRequired, DisplayOrder, IsActive)
                VALUES (rec.GroupName, rec.FieldName, 'Text', false, 99, true);
            END IF;
            
            -- Add to aggregated_template
            IF aggregated_template ? rec.GroupName THEN
                -- If array exists but doesn't contain the field
                IF NOT (aggregated_template->rec.GroupName @> jsonb_build_array(rec.FieldName)) THEN
                    aggregated_template := jsonb_set(
                        aggregated_template, 
                        ARRAY[rec.GroupName], 
                        (aggregated_template->rec.GroupName) || jsonb_build_array(rec.FieldName)
                    );
                END IF;
            ELSE
                -- Create new array
                aggregated_template := jsonb_set(
                    aggregated_template, 
                    ARRAY[rec.GroupName], 
                    jsonb_build_array(rec.FieldName)
                );
            END IF;
        END LOOP;
        
        -- Update the Category if we found specifications
        IF aggregated_template != '{}'::jsonb THEN
            UPDATE Categories 
            SET SpecificationTemplate = aggregated_template 
            WHERE Id = cat_rec.Id;
        END IF;
    END LOOP;
END $$;
