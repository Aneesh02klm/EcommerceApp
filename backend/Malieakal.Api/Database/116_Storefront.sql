-- Database/107_Storefront.sql

CREATE TABLE IF NOT EXISTS StorefrontConfig (
    Id SERIAL PRIMARY KEY,
    ConfigJson JSONB NOT NULL,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS PreBookingEnquiries (
    Id SERIAL PRIMARY KEY,
    FullName VARCHAR(255) NOT NULL,
    ContactNumber VARCHAR(50) NOT NULL,
    Email VARCHAR(255),
    VariantOfInterest VARCHAR(255),
    Notes TEXT,
    Status VARCHAR(50) DEFAULT 'Pending', -- Pending, Contacted, Converted, Closed
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial layout if empty
INSERT INTO StorefrontConfig (ConfigJson)
SELECT '{
  "sections": [
    {
      "id": "hero_slider",
      "type": "HeroSlider",
      "isActive": true,
      "order": 1,
      "title": "",
      "subtitle": ""
    },
    {
      "id": "featured_categories",
      "type": "FeaturedCategories",
      "isActive": true,
      "order": 2,
      "title": "Featured Departments",
      "subtitle": "CURATED COLLECTIONS",
      "categoryIds": []
    },
    {
      "id": "lightning_deals",
      "type": "ProductGrid",
      "isActive": true,
      "order": 3,
      "title": "Lightning Deals",
      "subtitle": "HURRY UP",
      "productTags": [],
      "productIds": []
    },
    {
      "id": "new_arrivals",
      "type": "ProductGrid",
      "isActive": true,
      "order": 4,
      "title": "New Arrivals",
      "subtitle": "LATEST TECH",
      "productTags": [],
      "productIds": []
    },
    {
      "id": "brand_partners",
      "type": "BrandPartners",
      "isActive": true,
      "order": 5,
      "title": "Authorized Brand Partners",
      "subtitle": "TOP BRANDS",
      "brandIds": []
    },
    {
      "id": "legacy_story",
      "type": "ContentBlock",
      "isActive": true,
      "order": 6,
      "title": "Our Legacy",
      "subtitle": "SINCE 1990",
      "htmlContent": "<p>Welcome to our store.</p>"
    },
    {
      "id": "pre_booking",
      "type": "PreBookingForm",
      "isActive": true,
      "order": 7,
      "title": "Pre-Book Latest Flagship",
      "subtitle": "SECURE YOURS NOW",
      "description": "Fill the form below and our team will contact you for confirmation."
    }
  ]
}'
WHERE NOT EXISTS (SELECT 1 FROM StorefrontConfig);
