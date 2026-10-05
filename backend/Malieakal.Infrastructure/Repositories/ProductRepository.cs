using Dapper;
using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Malieakal.Infrastructure.Repositories
{
    public class ProductRepository : IProductRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public ProductRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<Product>> GetAllAsync()
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<Product>("SELECT * FROM Products ORDER BY CreatedAt DESC");
        }

        public async Task<Product?> GetByIdAsync(Guid id)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                SELECT p.*, c.Slug as CategorySlug, b.Slug as BrandSlug FROM Products p 
                    LEFT JOIN Categories c ON p.CategoryId = c.Id
                    LEFT JOIN Brands b ON p.BrandId = b.Id
                    WHERE p.Id = @Id;
                SELECT * FROM ProductImages WHERE ProductId = @Id ORDER BY DisplayOrder;
                SELECT * FROM ProductSpecifications WHERE ProductId = @Id;
                SELECT pv.*, p2.Slug as LinkedProductSlug, (SELECT ImageUrl FROM ProductImages WHERE ProductId = p2.Id ORDER BY DisplayOrder LIMIT 1) as LinkedProductImageUrl FROM ProductVariants pv LEFT JOIN Products p2 ON pv.LinkedProductId = p2.Id WHERE pv.ProductId = @Id;
                SELECT * FROM ProductRichMedia WHERE ProductId = @Id ORDER BY DisplayOrder;
            ";
            
            using var multi = await connection.QueryMultipleAsync(sql, new { Id = id });
            var product = await multi.ReadSingleOrDefaultAsync<Product>();
            
            if (product != null)
            {
                product.Images = (await multi.ReadAsync<ProductImage>()).ToList();
                product.Specifications = (await multi.ReadAsync<ProductSpecification>()).ToList();
                product.Variants = (await multi.ReadAsync<ProductVariant>()).ToList();
                product.RichMedia = (await multi.ReadAsync<ProductRichMedia>()).ToList();
            }

            if (product != null && !string.IsNullOrEmpty(product.FamilyCode)) {
                var siblings = await connection.QueryAsync<dynamic>(
                    "SELECT p.Id, p.Name, p.Slug, p.SKU, p.FinalPrice, p.MRP, (SELECT ImageUrl FROM ProductImages WHERE ProductId = p.Id ORDER BY DisplayOrder LIMIT 1) as ImageUrl, c.Slug as CategorySlug, b.Slug as BrandSlug, p.SpecificationJson FROM Products p LEFT JOIN Categories c ON p.CategoryId = c.Id LEFT JOIN Brands b ON p.BrandId = b.Id WHERE p.FamilyCode = @FamilyCode AND p.IsActive = true",
                    new { FamilyCode = product.FamilyCode }
                );
                product.FamilyVariants = siblings.ToList();
            }
            return product;
        }

        public async Task<Product?> GetBySlugAsync(string slug)
        {
            using var connection = _connectionFactory.CreateConnection();
            
            // First get the product ID by slug
            var prodSql = "SELECT Id FROM Products WHERE Slug = @Slug LIMIT 1";
            var prodId = await connection.QuerySingleOrDefaultAsync<Guid?>(prodSql, new { Slug = slug });
            
            if (prodId == null) return null;
            
            return await GetByIdAsync(prodId.Value);
        }

        public async Task CreateAsync(Product product)
        {
            using var connection = _connectionFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();
            
            try
            {
                var sql = @"
                    INSERT INTO Products (Id, CategoryId, SubcategoryId, BrandId, Name, Slug, SKU, FamilyCode, Model, MRP, Discount, DiscountType, FinalPrice, Stock, Description, Features, Highlights, IsActive, IsBestSeller, CreatedAt, UpdatedAt, SpecificationJson)
                    VALUES (@Id, @CategoryId, @SubcategoryId, @BrandId, @Name, @Slug, @SKU, @FamilyCode, @Model, @MRP, @Discount, @DiscountType, @FinalPrice, @Stock, @Description, @Features, @Highlights, @IsActive, @IsBestSeller, @CreatedAt, @UpdatedAt, @SpecificationJson::jsonb);";
                await connection.ExecuteAsync(sql, product, transaction);

                if (product.Images != null && product.Images.Any())
                {
                    var imgSql = @"INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, DisplayOrder) VALUES (@ProductId, @ImageUrl, @IsPrimary, @DisplayOrder);";
                    foreach(var img in product.Images) { img.ProductId = product.Id; }
                    await connection.ExecuteAsync(imgSql, product.Images, transaction);
                }

                if (product.Specifications != null && product.Specifications.Any())
                {
                    var specSql = @"INSERT INTO ProductSpecifications (ProductId, SpecificationDefinitionId, Value) VALUES (@ProductId, @SpecificationDefinitionId, @Value);";
                    foreach(var spec in product.Specifications) { spec.ProductId = product.Id; }
                    await connection.ExecuteAsync(specSql, product.Specifications, transaction);
                }

                // Update Variants
                await connection.ExecuteAsync("DELETE FROM ProductVariants WHERE ProductId = @Id", new { Id = product.Id }, transaction);
                if (product.Variants != null && product.Variants.Any())
                {
                    var varSql = "INSERT INTO ProductVariants (ProductId, GroupName, OptionName, LinkedProductId) VALUES (@ProductId, @GroupName, @OptionName, @LinkedProductId);";
                    foreach(var variant in product.Variants) { variant.ProductId = product.Id; }
                    await connection.ExecuteAsync(varSql, product.Variants, transaction);
                }

                transaction.Commit();
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        
        public async Task UpdateStockAsync(Guid productId, int quantityDelta)
        {
            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync("UPDATE Products SET Stock = Stock + @Delta WHERE Id = @Id", new { Delta = quantityDelta, Id = productId });
        }

        public async Task UpdateAsync(Product product)
        {
            using var connection = _connectionFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();

            try
            {
                var sql = @"
                    UPDATE Products 
                    SET CategoryId = @CategoryId, SubcategoryId = @SubcategoryId, BrandId = @BrandId, Name = @Name, 
                        Slug = @Slug, SKU = @SKU, Model = @Model, MRP = @MRP, Discount = @Discount, DiscountType = @DiscountType, FinalPrice = @FinalPrice, 
                        Stock = @Stock, Description = @Description, Features = @Features, Highlights = @Highlights, 
                        IsActive = @IsActive, IsBestSeller = @IsBestSeller, UpdatedAt = @UpdatedAt, SpecificationJson = @SpecificationJson::jsonb
                    WHERE Id = @Id;";
                await connection.ExecuteAsync(sql, product, transaction);

                // Update Images: Simple approach is delete and recreate
                await connection.ExecuteAsync("DELETE FROM ProductImages WHERE ProductId = @Id", new { Id = product.Id }, transaction);
                if (product.Images != null && product.Images.Any())
                {
                    var imgSql = @"INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, DisplayOrder) VALUES (@ProductId, @ImageUrl, @IsPrimary, @DisplayOrder);";
                    foreach(var img in product.Images) { img.ProductId = product.Id; }
                    await connection.ExecuteAsync(imgSql, product.Images, transaction);
                }

                // Update Specifications
                await connection.ExecuteAsync("DELETE FROM ProductSpecifications WHERE ProductId = @Id", new { Id = product.Id }, transaction);
                if (product.Specifications != null && product.Specifications.Any())
                {
                    var specSql = @"INSERT INTO ProductSpecifications (ProductId, SpecificationDefinitionId, Value) VALUES (@ProductId, @SpecificationDefinitionId, @Value);";
                    foreach(var spec in product.Specifications) { spec.ProductId = product.Id; }
                    await connection.ExecuteAsync(specSql, product.Specifications, transaction);
                }

                // Update Variants
                await connection.ExecuteAsync("DELETE FROM ProductVariants WHERE ProductId = @Id", new { Id = product.Id }, transaction);
                if (product.Variants != null && product.Variants.Any())
                {
                    var varSql = "INSERT INTO ProductVariants (ProductId, GroupName, OptionName, LinkedProductId) VALUES (@ProductId, @GroupName, @OptionName, @LinkedProductId);";
                    foreach(var variant in product.Variants) { variant.ProductId = product.Id; }
                    await connection.ExecuteAsync(varSql, product.Variants, transaction);
                }

                transaction.Commit();
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        
        public async Task DeleteAsync(Guid id)
        {
            using var connection = _connectionFactory.CreateConnection();
            connection.Open();
            using var tx = connection.BeginTransaction();
            try {
                await connection.ExecuteAsync("DELETE FROM ProductImages WHERE ProductId = @Id", new { Id = id }, tx);
                await connection.ExecuteAsync("DELETE FROM ProductSpecifications WHERE ProductId = @Id", new { Id = id }, tx);
                await connection.ExecuteAsync("DELETE FROM ProductVariants WHERE ProductId = @Id", new { Id = id }, tx);
                await connection.ExecuteAsync("DELETE FROM ProductRichMedia WHERE ProductId = @Id", new { Id = id }, tx);
                await connection.ExecuteAsync("DELETE FROM Products WHERE Id = @Id", new { Id = id }, tx);
                tx.Commit();
            } catch {
                tx.Rollback();
                throw;
            }
        }

        public async Task<IEnumerable<Product>> SearchAsync(Malieakal.Application.Models.ProductSearchQuery query)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = new System.Text.StringBuilder(@"
                SELECT p.*, c.Slug as CategorySlug, b.Slug as BrandSlug 
                FROM Products p
                LEFT JOIN Categories c ON p.CategoryId = c.Id
                LEFT JOIN Brands b ON p.BrandId = b.Id
                WHERE 1=1 ");
              var parameters = new DynamicParameters();
            if (query.IsActive.HasValue)
            {
                sql.Append(" AND p.IsActive = @IsActive ");
                parameters.Add("IsActive", query.IsActive.Value);
            }
            else
            {
                sql.Append(" AND p.IsActive = TRUE ");
            }

            if (!string.IsNullOrWhiteSpace(query.Keyword))
            {
                sql.Append(" AND (p.Name ILIKE @Keyword OR p.Description ILIKE @Keyword OR p.SKU ILIKE @Keyword) ");
                parameters.Add("Keyword", $"%{query.Keyword}%");
            }
            if (query.CategoryId.HasValue)
            {
                sql.Append(" AND p.CategoryId = @CategoryId ");
                parameters.Add("CategoryId", query.CategoryId.Value);
            }
            if (query.BrandId.HasValue)
            {
                sql.Append(" AND p.BrandId = @BrandId ");
                parameters.Add("BrandId", query.BrandId.Value);
            }
            if (query.InStockOnly.HasValue && query.InStockOnly.Value)
            {
                sql.Append(" AND p.Stock > 0 ");
            }
            if (query.MinPrice.HasValue)
            {
                sql.Append(" AND p.FinalPrice >= @MinPrice ");
                parameters.Add("MinPrice", query.MinPrice.Value);
            }
            if (query.MaxPrice.HasValue)
            {
                sql.Append(" AND p.FinalPrice <= @MaxPrice ");
                parameters.Add("MaxPrice", query.MaxPrice.Value);
            }

            if (query.SpecFilters != null && query.SpecFilters.Any())
            {
                int specIndex = 0;
                foreach (var spec in query.SpecFilters)
                {
                    if (string.IsNullOrWhiteSpace(spec.Value)) continue;
                    var vals = spec.Value.Split(',').Select(v => v.Trim()).ToList();
                    sql.Append($" AND EXISTS (SELECT 1 FROM ProductSpecifications ps{specIndex} WHERE ps{specIndex}.ProductId = p.Id AND ps{specIndex}.SpecificationDefinitionId = @SpecDef{specIndex} AND ps{specIndex}.Value = ANY(@SpecVal{specIndex})) ");
                    parameters.Add($"SpecDef{specIndex}", spec.Key);
                    parameters.Add($"SpecVal{specIndex}", vals);
                    specIndex++;
                }
            }

            sql.Append(query.SortBy switch
            {
                "PriceLow" => " ORDER BY p.FinalPrice ASC ",
                "PriceHigh" => " ORDER BY p.FinalPrice DESC ",
                "Newest" => " ORDER BY p.CreatedAt DESC ",
                "Popularity" => " ORDER BY (SELECT COALESCE(SUM(Quantity), 0) FROM OrderItems WHERE ProductId = p.Id) DESC, FinalPrice ASC ",
                _ => " ORDER BY p.CreatedAt DESC "
            });

            var pageSize = query.PageSize > 0 ? query.PageSize : 20;
            var offset = (query.Page > 0 ? query.Page - 1 : 0) * pageSize;
            
            sql.Append(" LIMIT @Limit OFFSET @Offset");
            parameters.Add("Limit", pageSize);
            parameters.Add("Offset", offset);

            var products = (await connection.QueryAsync<Product>(sql.ToString(), parameters)).ToList();
            
            // For a production system with pagination, it's safe to fetch images for the returned subset.
            // Simplified for now:
            if (products.Any())
            {
                var productIds = products.Select(p => p.Id).ToList();
                var images = await connection.QueryAsync<ProductImage>("SELECT * FROM ProductImages WHERE ProductId = ANY(@Ids) ORDER BY DisplayOrder", new { Ids = productIds });
                var variants = await connection.QueryAsync<ProductVariant>("SELECT * FROM ProductVariants WHERE ProductId = ANY(@Ids)", new { Ids = productIds });
                
                var imageLookup = images.GroupBy(img => img.ProductId).ToDictionary(g => g.Key, g => g.ToList());
                var variantLookup = variants.GroupBy(v => v.ProductId).ToDictionary(g => g.Key, g => g.ToList());
                
                foreach (var product in products)
                {
                    if (imageLookup.TryGetValue(product.Id, out var prodImages))
                    {
                        product.Images = prodImages;
                    }
                    if (variantLookup.TryGetValue(product.Id, out var prodVars))
                    {
                        product.Variants = prodVars;
                    }
                }
            }

            return products;
        }

        public async Task<Malieakal.Application.Models.ProductFacets> GetProductFacetsAsync(Malieakal.Application.Models.ProductSearchQuery query)
        {
            using var connection = _connectionFactory.CreateConnection();
            var facets = new Malieakal.Application.Models.ProductFacets();

            // We use Dapper QueryMultipleAsync or just individual queries
            var param = new DynamicParameters();
            var sqlCondition = new System.Text.StringBuilder("WHERE p.IsActive = TRUE ");

            if (!string.IsNullOrWhiteSpace(query.Keyword))
            {
                sqlCondition.Append(" AND (p.Name ILIKE @Keyword OR p.Description ILIKE @Keyword OR p.SKU ILIKE @Keyword) ");
                param.Add("Keyword", $"%{query.Keyword}%");
            }
            if (query.CategoryId.HasValue)
            {
                sqlCondition.Append(" AND p.CategoryId = @CategoryId ");
                param.Add("CategoryId", query.CategoryId.Value);
            }
            
            // Price range
            var priceSql = $"SELECT COALESCE(MIN(p.FinalPrice), 0) as Min, COALESCE(MAX(p.FinalPrice), 0) as Max FROM Products p {sqlCondition}";
            var priceRange = await connection.QuerySingleOrDefaultAsync<Malieakal.Application.Models.PriceRangeFacet>(priceSql, param);
            if (priceRange != null) facets.PriceRange = priceRange;

            // Brands
            var brandsSql = $@"
                SELECT b.Id, b.Name, COUNT(p.Id) as Count
                FROM Brands b
                JOIN Products p ON b.Id = p.BrandId
                {sqlCondition}
                GROUP BY b.Id, b.Name
                ORDER BY b.Name";
            facets.Brands = (await connection.QueryAsync<Malieakal.Application.Models.BrandFacet>(brandsSql, param)).ToList();

            // Specs - fallback to simple JSON aggregation or Specification table.
            // Using ProductSpecifications table:
            var specsSql = $@"
                SELECT sd.Id as SpecId, sd.Name, ps.Value, COUNT(p.Id) as Count
                FROM ProductSpecifications ps
                JOIN SpecificationDefinitions sd ON ps.SpecificationDefinitionId = sd.Id
                JOIN Products p ON ps.ProductId = p.Id
                {sqlCondition}
                GROUP BY sd.Id, sd.Name, ps.Value
                ORDER BY sd.Name, ps.Value";
            
            var rawSpecs = await connection.QueryAsync(specsSql, param);
            var groupedSpecs = rawSpecs.GroupBy(x => new { x.specid, x.name }).Select(g => new Malieakal.Application.Models.SpecFacet
            {
                SpecId = (int)g.Key.specid,
                Name = (string)g.Key.name,
                Values = g.Select(v => new Malieakal.Application.Models.SpecValueFacet { Value = (string)v.value, Count = (int)v.count }).ToList()
            }).ToList();
            
            facets.Specs = groupedSpecs;

            return facets;
        }
    }
}

