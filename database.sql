-- Create Database
CREATE DATABASE IF NOT EXISTS lms;
USE lms;

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Leads Table
CREATE TABLE IF NOT EXISTS leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Sample User (password: user123)
INSERT INTO users (email, password, name) VALUES
('user@example.com', '$2y$10$gSvqqUNVlXP2tfVFaWK1Be1DQGspBTEDVRIqlJrgifvJmZlH9EZIS', 'Test User');

-- Insert Sample Leads
INSERT INTO leads (name, email, phone) VALUES
('John Doe', 'john@example.com', '1234567890'),
('Jane Smith', 'jane@example.com', '0987654321'),
('Mike Johnson', 'mike@example.com', '5555555555'),
('Sarah Williams', 'sarah@example.com', '4444444444');
