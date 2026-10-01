-- Auth Schema Foundation

CREATE TABLE IF NOT EXISTS Roles (
    Id SERIAL PRIMARY KEY,
    Name VARCHAR(50) NOT NULL UNIQUE,
    Description VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS Users (
    Id UUID PRIMARY KEY,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Email VARCHAR(255) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    Phone VARCHAR(20),
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS UserRoles (
    UserId UUID REFERENCES Users(Id) ON DELETE CASCADE,
    RoleId INT REFERENCES Roles(Id) ON DELETE CASCADE,
    PRIMARY KEY (UserId, RoleId)
);

-- Seed basic roles
INSERT INTO Roles (Name, Description) VALUES
    ('Admin', 'Administrator with full access'),
    ('Customer', 'Standard customer'),
    ('Support', 'Customer support agent'),
    ('Delivery', 'Delivery personnel')
ON CONFLICT (Name) DO NOTHING;
