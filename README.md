# BlockBid Auction System - Backend API

EECS 4413 - Building e-Commerce Systems  
Deliverable 2 - Backend Implementation  
Students: Kyle Williamson

## Project Description

BlockBid is a forward auction e-commerce system where sellers can list items for auction and buyers can place bids. The system implements all core auction functionality including user management, item cataloging, real-time bidding, auction completion, and payment processing.

## Technology Stack

- **Backend Framework:** Java Spring Boot 3.2.0
- **Database:** H2 (in-memory) for development
- **Build Tool:** Maven
- **API Style:** RESTful with HATEOAS
- **Testing:** Postman

**Note:** The original design document (Deliverable 1) proposed Node.js/Express. We changed to Java/Spring Boot for this implementation due to team expertise and development efficiency. The architecture and use cases remain unchanged.

## Prerequisites

- Java 17 or higher
- Maven 3.6+
- Postman (for testing)
- Git

## Installation Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/kawilliam/blockbid-auction.git
cd blockbid-auction
```

### 2. Build the Project
```bash
mvn clean install
```

### 3. Run the Application
```bash
mvn spring-boot:run
```

The application will start on `http://localhost:8080`

You should see:
```
==========================================
BlockBid Auction System Started Successfully!
Access at: http://localhost:8080
H2 Console: http://localhost:8080/h2-console
==========================================
```

### 4. (Optional) Load Sample Data

For easier testing, you can load pre-populated sample data:

**Option A: Using H2 Console**
1. Start the application
2. Go to `http://localhost:8080/h2-console`
3. Login with:
   - JDBC URL: `jdbc:h2:mem:blockbiddb`
   - Username: `sa`
   - Password: (leave blank)
4. Copy and paste the contents of `sample_data.sql` and execute

**Sample Data Includes:**
- 3 Users: seller1, buyer1, buyer2 (all passwords: `pass123`)
- 4 Active auction items
- 8 bids across different items
- Items at various stages (no bids, active bidding)

**Quick Test Scenario:**
1. Login as `buyer1` (password: `pass123`)
2. Browse items: `GET /api/items`
3. Place bid on Item 3 (has no bids): `POST /api/auctions/items/3/bid?bidderId=2&amount=350`
4. End auction: `POST /api/auctions/items/3/end`
5. Process payment: `POST /api/payments/items/3?userId=2`

## Testing the API

### Option 1: Using Postman Collection (Recommended)

1. Import `BlockBid_Postman_Collection.json` into Postman
2. Run the collection in order (tests are numbered TC001-TC016)
3. Note: The database resets on each application restart

### Option 2: Manual Testing with curl

See the test cases section below for curl examples.

## Implemented Use Cases

### UC1.1 - User Sign-Up
- Endpoint: `POST /api/users/signup`
- Creates new user with validation
- Returns user data with HATEOAS links

### UC1.2 - User Login  
- Endpoint: `POST /api/users/login`
- Authenticates user credentials
- Returns user data with next actions

### UC2.1 - Browse Catalogue
- Endpoint: `GET /api/items`
- Returns all active auction items

### UC2.2 - Search Items
- Endpoint: `GET /api/items/search?keyword={keyword}`
- Searches items by title and description

### UC7 - Seller Upload Item
- Endpoint: `POST /api/items?sellerId={id}`
- Creates new auction item
- Automatically sets to ACTIVE status

### UC3 - Bidding
- Endpoint: `POST /api/auctions/items/{id}/bid?bidderId={id}&amount={amount}`
- Places bid with validation
- Updates item current price
- Tracks bid history

### UC4 - Auction End
- Endpoint: `POST /api/auctions/items/{id}/end`
- Ends auction and determines winner
- Changes status to ENDED

### UC5 - Payment
- Endpoint: `POST /api/payments/items/{id}?userId={id}`
- Processes payment (winner only)
- Calculates total with shipping

### UC6 - Receipt
- Included in payment response
- Shows itemPrice, shippingCost, total

## Test Cases Coverage

The Postman collection includes 16 comprehensive test cases:

- **TC001-TC004:** User Management (signup, login, validation)
- **TC005-TC006:** Browse and Search
- **TC007-TC008:** Item Upload
- **TC009-TC012:** Bidding (successful, validation, history)
- **TC013-TC014:** Auction End
- **TC015-TC016:** Payment (winner/non-winner)

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/users/signup | User registration |
| POST | /api/users/login | User authentication |
| GET | /api/items | Browse all items |
| GET | /api/items/search | Search items |
| POST | /api/items | Create auction item |
| POST | /api/auctions/items/{id}/bid | Place bid |
| GET | /api/auctions/items/{id}/bids | Get bid history |
| POST | /api/auctions/items/{id}/end | End auction |
| POST | /api/payments/items/{id} | Process payment |

## Database

The application uses H2 in-memory database which:
- Automatically creates schema on startup
- Resets on each application restart
- Can be accessed at: `http://localhost:8080/h2-console`
  - JDBC URL: `jdbc:h2:mem:blockbiddb`
  - Username: `sa`
  - Password: (leave blank)

## Project Structure
```
src/main/java/com/blockbid/
├── BlockbidApplication.java          # Main entry point
├── user/                              # UC1 - User Management
│   ├── User.java
│   ├── UserRepository.java
│   ├── UserService.java
│   └── UserController.java
├── catalogue/                         # UC2, UC7 - Items
│   ├── Item.java
│   ├── ItemRepository.java
│   ├── ItemService.java
│   └── ItemController.java
├── auction/                           # UC3, UC4 - Bidding
│   ├── Bid.java
│   ├── BidRepository.java
│   ├── AuctionService.java
│   └── AuctionController.java
└── payment/                           # UC5, UC6 - Payment
    ├── Payment.java
    ├── PaymentRepository.java
    ├── PaymentService.java
    └── PaymentController.java
```

## Design Decisions

### Technology Change: Node.js → Java/Spring Boot
**Reason:** Team has stronger expertise in Java. Spring Boot provides excellent REST API support, built-in HATEOAS, and robust database integration.

**What Changed:** Implementation language and framework  
**What Stayed the Same:** Architecture (microservices-ready), use cases, database schema, REST API design

### Architecture
- **Layered architecture:** Controller → Service → Repository
- **Separation of concerns:** Each layer has single responsibility
- **RESTful design:** Standard HTTP methods with HATEOAS links
- **Transaction management:** @Transactional for data consistency

## Known Limitations

1. **Password Security:** Passwords stored as plain text (will add hashing in Deliverable 3)
2. **Authentication:** No JWT tokens yet (planned for Deliverable 3)
3. **Real-time Updates:** WebSocket for live bidding planned for Deliverable 3
4. **Blockchain:** UC8 advanced feature deferred to Deliverable 3

## Git Repository

https://github.com/kawilliam/blockbid-auction

## Contact

For questions or issues, contact the development team through the course eClass.