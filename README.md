# BlockBid Auction System - Full Stack Microservices

EECS 4413 - Building e-Commerce Systems  
Deliverable 3 - Full System Implementation  
Students: Kyle Williamson

## Project Description

BlockBid is a microservices-based forward auction e-commerce platform where sellers list items and buyers place real-time bids. The system features a complete frontend interface, five independent microservices (User, Item, Auction, Payment, Blockchain), an API Gateway, and blockchain integration for auction transparency.

## Technology Stack

**Backend:**
- Java Spring Boot 3.2.0 (5 microservices + API Gateway)
- H2 Database (per-service pattern)
- JWT Authentication (Spring Security)
- WebSocket (real-time bidding updates)
- RestTemplate (inter-service communication)

**Frontend:**
- Vanilla JavaScript (ES6+)
- HTML5/CSS3 (Yeezy-inspired dark theme)
- WebSocket client for real-time updates

**Blockchain (UC8 - Distinguishable Feature):**
- Ethereum blockchain integration
- Smart contracts for auction verification
- Immutable auction records

**DevOps:**
- Docker & Docker Compose
- Maven (build automation)
- Postman (API testing)

## Prerequisites

- Docker and Docker Compose
- Java 17+ (if running without Docker)
- Maven 3.6+ (if building from source)
- Postman (for API testing)
- Modern web browser

## Architecture

BlockBid uses a microservices architecture with the following components:

1. **API Gateway (Port 8080)** - Single entry point, request routing
2. **User Service (Port 8081)** - Authentication, JWT tokens
3. **Item Service (Port 8082)** - Catalogue management
4. **Auction Service (Port 8083)** - Bidding logic, WebSocket updates
5. **Payment Service (Port 8084)** - Transaction processing
6. **Blockchain Service (Port 8085)** - Auction verification (UC8)

## Installation & Deployment

### Option 1: Docker Deployment (Recommended)

1. **Clone the Repository**
```bash
git clone https://github.com/kawilliam/blockbid-auction.git
cd blockbid-auction
```

2. **Build and Run with Docker Compose**
```bash
docker-compose up --build
```

This will:
- Build all 6 microservices as Docker containers
- Start all services with proper networking
- Expose API Gateway on port 8080
- Serve frontend on http://localhost:8080

3. **Access the Application**
- Frontend: http://localhost:8080
- API Gateway: http://localhost:8080/api/*
- Individual services available on ports 8081-8085

4. **Stop Services**
```bash
docker-compose down
```

### Option 2: Manual Deployment (Development)

Run each service separately:

```bash
# Terminal 1 - API Gateway
cd api-gateway
mvn spring-boot:run

# Terminal 2 - User Service
cd user-service
mvn spring-boot:run

# Terminal 3 - Item Service
cd item-service
mvn spring-boot:run

# Terminal 4 - Auction Service
cd auction-service
mvn spring-boot:run

# Terminal 5 - Payment Service
cd payment-service
mvn spring-boot:run

# Terminal 6 - Blockchain Service
cd blockchain-service
mvn spring-boot:run
```

Then open `frontend/index.html` in a browser.

## Using the Application

### Frontend Interface

1. **Login/Signup** (index.html)
   - Register new account or login with existing credentials
   - JWT token stored in localStorage

2. **Catalogue** (catalogue.html)
   - Browse all active auctions
   - Search by keyword
   - View item details

3. **Bidding** (bidding.html)
   - Real-time bid updates via WebSocket
   - Place bids with validation
   - View current highest bidder

4. **My Bids** (my-bids.html)
   - Track your active bids
   - See auction status

5. **My Listings** (my-listings.html)
   - View your auction items
   - End auctions manually

6. **Payment** (payment.html)
   - Process winning bids
   - Calculate shipping costs

7. **Receipt** (receipt.html)
   - View payment confirmation
   - Blockchain verification link

### Test Users
- **seller1** / pass123 (has listings)
- **buyer1** / pass123
- **buyer2** / pass123

## Testing the API

### Option 1: Postman Collection (Comprehensive)

Import `Blockbid_Microservices_API_Tests_CORRECTED.json` into Postman:
- 50+ test cases covering all microservices
- Positive and negative scenarios
- Security testing (unauthorized access)
- Scalability testing (concurrent operations)

### Option 2: Frontend Testing

Use the web interface to test complete user flows:
1. Sign up as new user
2. Browse catalogue
3. Place bids on items
4. Monitor real-time updates
5. Complete payment after winning

## Implemented Use Cases

### UC1.1 - User Sign-Up
- **Service:** User Service
- **Frontend:** index.html signup form
- **API:** `POST /api/users/signup`
- Validates username/email uniqueness, password strength

### UC1.2 - User Login
- **Service:** User Service  
- **Frontend:** index.html login form
- **API:** `POST /api/users/login`
- Returns JWT token for authentication

### UC2.1 - Browse Catalogue
- **Service:** Item Service
- **Frontend:** catalogue.html
- **API:** `GET /api/items`
- Displays all active auctions with current prices

### UC2.2 - Search Items
- **Service:** Item Service
- **Frontend:** catalogue.html search bar
- **API:** `GET /api/items/search?keyword={keyword}`
- Searches by title and description

### UC7 - Seller Upload Item
- **Service:** Item Service
- **Frontend:** seller.html
- **API:** `POST /api/items?sellerId={id}`
- Creates new auction with starting price, description

### UC3 - Bidding
- **Service:** Auction Service
- **Frontend:** bidding.html with WebSocket
- **API:** `POST /api/auctions/items/{id}/bid`
- Real-time bid updates to all connected clients
- Validation: bid must exceed current price

### UC4 - Auction End
- **Service:** Auction Service
- **Frontend:** my-listings.html
- **API:** `POST /api/auctions/items/{id}/end`
- Determines winner, updates item status

### UC5 - Payment
- **Service:** Payment Service
- **Frontend:** payment.html
- **API:** `POST /api/payments/items/{id}`
- Processes payment with shipping calculation
- Winner-only validation

### UC6 - Receipt
- **Frontend:** receipt.html
- Shows itemized payment details
- Includes blockchain verification link

### UC8 - Blockchain Integration (Distinguishable Feature)
- **Service:** Blockchain Service
- **Technology:** Ethereum smart contracts
- **Features:**
  - Record auction completion on blockchain
  - Generate immutable transaction records
  - Provide blockchain explorer links
  - Verify auction integrity
- **API:** `POST /api/blockchain/record-auction`

## Microservices API Endpoints

### User Service (Port 8081)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/users/signup | Register new user |
| POST | /api/users/login | Authenticate user (JWT) |
| GET | /api/users/{id} | Get user details |

### Item Service (Port 8082)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/items | List all active items |
| GET | /api/items/search | Search items by keyword |
| POST | /api/items | Create new auction item |
| GET | /api/items/{id} | Get item details |
| PUT | /api/items/{id}/price | Update item price |

### Auction Service (Port 8083)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auctions/items/{id}/bid | Place bid |
| GET | /api/auctions/items/{id}/bids | Get bid history |
| POST | /api/auctions/items/{id}/end | End auction |
| WebSocket | /ws/auction/{itemId} | Real-time bid updates |

### Payment Service (Port 8084)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/payments/items/{id} | Process payment |
| GET | /api/payments/orders/{id} | Get order details |

### Blockchain Service (Port 8085)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/blockchain/record-auction | Record on blockchain |
| GET | /api/blockchain/verify/{txHash} | Verify transaction |

## Test Coverage

The Postman collection includes comprehensive testing:

**Functional Tests:**
- User registration and authentication
- Item CRUD operations
- Bidding workflows
- Payment processing
- Blockchain recording

**Security Tests:**
- Unauthorized access attempts
- JWT token validation
- Input sanitization
- SQL injection prevention

**Robustness Tests:**
- Invalid data handling
- Edge cases (negative bids, duplicate users)
- Concurrent bid scenarios
- Service communication failures

**Scalability Tests:**
- Multiple simultaneous bids
- Concurrent auction endings
- High-volume item creation

## Database Architecture

Each microservice has its own H2 database instance following the database-per-service pattern:

- **User Service DB:** User accounts, credentials
- **Item Service DB:** Auction items, catalogue
- **Auction Service DB:** Bids, auction history
- **Payment Service DB:** Orders, transactions
- **Blockchain Service DB:** Transaction records, smart contract metadata

All databases are H2 in-memory and reset on service restart.

## Project Structure

```
blockbid-auction/
├── docker-compose.yml              # Multi-service orchestration
├── Dockerfile                      # Service containerization
├── pom.xml                        # Maven parent
│
├── api-gateway/                   # Port 8080
│   ├── ApiGatewayApplication.java
│   ├── WebClientConfig.java
│   └── WebSocketProxyConfig.java
│
├── user-service/                  # Port 8081
│   ├── User.java
│   ├── UserService.java
│   └── SecurityConfig.java
│
├── item-service/                  # Port 8082
│   ├── Item.java
│   └── ItemService.java
│
├── auction-service/               # Port 8083
│   ├── Auction.java, Bid.java
│   ├── AuctionService.java
│   └── WebSocketConfig.java
│
├── payment-service/               # Port 8084
│   ├── Payment.java, Order.java
│   └── PaymentService.java
│
├── blockchain-service/            # Port 8085
│   ├── BlockchainTransaction.java
│   ├── SmartContract.java
│   └── BlockchainUtils.java
│
└── frontend/                      # Static files
    ├── index.html, catalogue.html
    ├── bidding.html, my-bids.html
    ├── payment.html, receipt.html
    └── css/, js/
```

## Key Features Implemented

### Microservices Architecture
- Independent deployable services
- Database-per-service pattern
- RESTful inter-service communication
- Centralized API Gateway

### Real-time Updates
- WebSocket bidding notifications
- Live price updates
- Concurrent bid handling

### Security
- JWT-based authentication
- Password hashing (BCrypt)
- Input validation at service level
- CORS configuration

### Blockchain Integration (UC8)
- Smart contracts Simulation
- Immutable auction records
- Transaction verification
- Explorer integration

## Design Decisions

### Microservices vs Monolith
- **Rationale:** Scalability, independent deployment, technology flexibility
- **Implementation:** Each service has its own database and can scale independently
- **Challenge:** Cross-service data consistency managed via API calls

### WebSocket for Bidding
- **Rationale:** Real-time updates essential for auction dynamics
- **Implementation:** Dedicated WebSocket endpoint in Auction Service
- **Benefit:** Users see bids instantly without polling

### Blockchain as Distinguishable Feature
- **Rationale:** Adds transparency and immutability to auctions
- **Implementation:** Records auction completion Simulation
- **Value:** External verification of auction results

## Known Considerations

1. **Production Readiness:**
   - Switch to persistent databases (PostgreSQL/MySQL)
   - Implement service discovery (Eureka)
   - Add monitoring/logging (ELK stack)
   - Use production-grade blockchain network

2. **Future Enhancements:**
   - Email notifications
   - Advanced search filters
   - Auction scheduling
   - Admin dashboard

## Git Repository

https://github.com/kawilliam/blockbid-auction

## Contact

For questions or issues, contact the development team through the course eClass.