-- Sample Data for BlockBid Auction System
-- Run this after application starts to populate test data

-- Insert Sample Users
INSERT INTO users (id, username, password, first_name, last_name, email, street_number, street_name, city, province, country, postal_code, created_at) VALUES
(1, 'seller1', 'pass123', 'John', 'Seller', 'john@blockbid.com', '100', 'Main St', 'Toronto', 'ON', 'Canada', 'M5H2N2', CURRENT_TIMESTAMP),
(2, 'buyer1', 'pass123', 'Alice', 'Buyer', 'alice@blockbid.com', '200', 'Queen St', 'Toronto', 'ON', 'Canada', 'M5G1K3', CURRENT_TIMESTAMP),
(3, 'buyer2', 'pass123', 'Bob', 'Bidder', 'bob@blockbid.com', '300', 'King St', 'Toronto', 'ON', 'Canada', 'M5H1A1', CURRENT_TIMESTAMP);

-- Insert Sample Items (Auctions)
INSERT INTO items (id, title, description, starting_price, current_price, auction_type, auction_end_time, status, seller_id, created_at) VALUES
(1, 'Vintage Camera', 'Canon AE-1 from 1980s, excellent condition with original leather case', 150.00, 200.00, 'Forward', '2025-12-31 23:59:59', 'ACTIVE', 1, CURRENT_TIMESTAMP),
(2, 'Nikon 50mm Lens', 'Professional f/1.8 prime lens, barely used, mint condition', 180.00, 250.00, 'Forward', '2025-12-25 23:59:59', 'ACTIVE', 1, CURRENT_TIMESTAMP),
(3, 'Vintage Watch', 'Seiko automatic watch from 1970s, fully serviced', 300.00, 300.00, 'Forward', '2025-12-20 23:59:59', 'ACTIVE', 1, CURRENT_TIMESTAMP),
(4, 'MacBook Pro 2020', 'M1 chip, 16GB RAM, 512GB SSD, excellent condition', 800.00, 950.00, 'Forward', '2025-11-30 23:59:59', 'ACTIVE', 1, CURRENT_TIMESTAMP);

-- Insert Sample Bids
INSERT INTO bids (id, user_id, item_id, amount, bid_time) VALUES
(1, 2, 1, 160.00, CURRENT_TIMESTAMP - INTERVAL '2' HOUR),
(2, 3, 1, 180.00, CURRENT_TIMESTAMP - INTERVAL '1' HOUR),
(3, 2, 1, 200.00, CURRENT_TIMESTAMP - INTERVAL '30' MINUTE),
(4, 2, 2, 200.00, CURRENT_TIMESTAMP - INTERVAL '3' HOUR),
(5, 3, 2, 250.00, CURRENT_TIMESTAMP - INTERVAL '1' HOUR),
(6, 2, 4, 850.00, CURRENT_TIMESTAMP - INTERVAL '5' HOUR),
(7, 3, 4, 900.00, CURRENT_TIMESTAMP - INTERVAL '3' HOUR),
(8, 2, 4, 950.00, CURRENT_TIMESTAMP - INTERVAL '1' HOUR);

-- Note: Item 3 (Vintage Watch) has no bids yet - good for testing first bid scenario
-- Items 1, 2, and 4 have active bidding wars