CREATE TABLE IF NOT EXISTS Notifications (
    Id SERIAL PRIMARY KEY,
    UserId UUID NULL, -- NULL means Admin notification
    Role VARCHAR(50) DEFAULT 'Customer', -- 'Admin' or 'Customer'
    Title VARCHAR(255) NOT NULL,
    Message TEXT NOT NULL,
    LinkUrl VARCHAR(255),
    IsRead BOOLEAN DEFAULT false,
    IsCleared BOOLEAN DEFAULT false,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS OrderStatusHistory (
    Id SERIAL PRIMARY KEY,
    OrderId UUID REFERENCES Orders(Id) ON DELETE CASCADE,
    Status VARCHAR(50) NOT NULL,
    Comments TEXT,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
