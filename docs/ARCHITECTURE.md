
# Marketly — System Architecture

## 1. Project Overview

Marketly is a microservices-based multi-vendor e-commerce marketplace.

The platform allows multiple vendors to sell products while customers can browse products, manage shopping carts, apply coupons, and purchase products from multiple vendors through one combined Razorpay payment.

The system uses independent backend services connected through a centralized API Gateway.

## 2. High-Level Architecture

```mermaid
flowchart TB
    UI["React Frontend<br/>Port 5173"]
    GW["API Gateway<br/>Port 8000"]

    UI --> GW

    GW --> AUTH["Auth Service<br/>3001"]
    GW --> VENDOR["Vendor Service<br/>3002"]
    GW --> PRODUCT["Product Service<br/>3003"]
    GW --> CART["Cart Service<br/>3004"]
    GW --> ORDER["Order Service<br/>3005"]
    GW --> PAYMENT["Payment Service<br/>3006"]

    AUTH --> AUTHDB[("Auth Database")]
    VENDOR --> VENDORDB[("Vendor Database")]
    PRODUCT --> PRODUCTDB[("Product Database")]
    CART --> REDIS[("Redis")]
    ORDER --> ORDERDB[("Order Database")]
    PAYMENT --> PAYMENTDB[("Payment Database")]

    PRODUCT --> S3["AWS S3"]
    PRODUCT --> ES["Elasticsearch"]
    PAYMENT <--> RZP["Razorpay"]
```

## 3. Microservices Responsibilities

### Auth Service
Port: 3001

Responsibilities:
- Customer registration and login.
- JWT authentication.
- HTTP-only cookie management.
- User role management.
- Logout and session handling.

Database: Auth MongoDB.

### Vendor Service
Port: 3002

Responsibilities:
- Vendor application submission.
- Vendor profile management.
- Admin approval and rejection.
- User role synchronization with Auth Service.

Database: Vendor MongoDB.

### Product Service
Port: 3003

Responsibilities:
- Product creation and management.
- Product image uploads.
- AWS S3 integration.
- Elasticsearch product search.
- Product filtering and sorting.
- Customer product reviews and ratings.
- Approved vendor verification.

Database: Product MongoDB.

External integrations:
- AWS S3.
- Elasticsearch.
- Vendor database for approved-vendor verification.

### Cart Service
Port: 3004

Responsibilities:
- Add products to cart.
- Update cart quantities.
- Remove products.
- Clear cart.
- Retrieve customer cart.

Storage: Redis.

Each authenticated customer maintains an individual shopping cart.

### Order Service
Port: 3005

Responsibilities:
- Multi-vendor checkout.
- Vendor-wise order creation.
- Coupon validation and redemption.
- Discount allocation.
- Order cancellation.
- Order tracking.
- Invoice generation.
- Internal payment-status synchronization.

Database: Order MongoDB.

### Payment Service
Port: 3006

Responsibilities:
- Razorpay order creation.
- Single-order payment.
- Combined multi-vendor payment.
- Payment signature verification.
- Vendor-wise commission calculation.
- Payment history.
- Admin payment analytics.
- Razorpay webhook processing.

Database: Payment MongoDB.

Collections:
- payments
- checkoutpayments
- webhookevents

External integration:
- Razorpay Test Mode.

## 4. Multi-Vendor Checkout Architecture

A customer can purchase products from different vendors in one checkout.

### Order Creation Flow

```mermaid
flowchart TD
    A["Customer Shopping Cart"] --> B["Order Service"]
    B --> C["Fetch and Validate Products"]
    C --> D["Group Products by Vendor"]
    D --> E["Calculate Coupon Discount"]
    E --> F["Generate Common Checkout ID"]
    F --> G["Create Vendor A Order"]
    F --> H["Create Vendor B Order"]
    G --> I["Save Vendor Orders"]
    H --> I
    I --> J["Clear Customer Cart"]
```

### Single Payment Flow

```mermaid
sequenceDiagram
    participant C as Customer
    participant F as Frontend
    participant O as Order Service
    participant P as Payment Service
    participant R as Razorpay

    C->>F: Place Order & Pay
    F->>O: Create Vendor Orders
    O-->>F: Orders + Checkout ID
    F->>P: Create Combined Payment
    P->>O: Fetch Checkout Orders
    O-->>P: Vendor Orders
    P->>R: Create One Razorpay Order
    R-->>P: Razorpay Order ID
    P-->>F: Payment Details
    F->>R: Open Razorpay Checkout
    R-->>F: Payment Response
    F->>P: Verify Payment
    P->>R: Verify and Capture Payment
    R-->>P: Captured Payment
    P->>O: Update All Vendor Orders
    O-->>P: Orders Updated
    P-->>F: Payment Successful
```

## 5. Payment Allocation

The combined payment is stored as one checkout payment record.

The payment contains:
- Common checkout ID.
- Multiple vendor order IDs.
- Customer ID.
- Combined payment amount.
- Razorpay order and payment IDs.
- Vendor-wise allocations.
- Platform commission.
- Vendor earnings.
- Payment status.

Commission is calculated on the combined payment and distributed proportionally across vendor allocations.

All monetary amounts are stored in paise.

**Important:** Calculated vendor earnings are internal accounting records. Actual bank payouts require a separate payout integration.

## 6. Razorpay Webhook Architecture

```mermaid
flowchart TD
    A["Razorpay Payment Event"] --> B["Public HTTPS Webhook URL"]
    B --> C["Payment Service"]
    C --> D["Verify Webhook Signature"]
    D --> E["Check Duplicate Event"]
    E --> F["Find Payment Record"]
    F --> G["Update Payment Status"]
    G --> H["Synchronize Vendor Orders"]
    H --> I["Save Webhook Event"]
    I --> J["Return HTTP 200"]
```

Supported events:
- payment.captured
- payment.failed

Webhook processing uses signature verification and event tracking to prevent duplicate processing.

## 7. Internal Service Communication

Internal service requests are used for trusted backend-to-backend communication.

Examples:

- Vendor Service updates user roles in Auth Service.
- Payment Service retrieves vendor orders from Order Service.
- Payment Service updates order payment statuses.
- Product Service verifies vendor approval.

Internal requests use configured service URLs and internal authentication keys where applicable.

## 8. Security Architecture

- JWT-based authentication.
- HTTP-only cookies.
- Role-based access control.
- Approved vendor authorization.
- Internal service authentication keys.
- Razorpay payment signature verification.
- Webhook signature verification.
- Environment-based secrets.
- CORS configuration with credentials.

## 9. External Integrations

| Technology | Purpose |
|---|---|
| AWS S3 | Product image storage |
| Elasticsearch | Product search and filtering |
| Redis | Cart caching |
| Razorpay | Online payment processing |
| Cloudflare Tunnel | Local webhook testing |

## 10. Order Lifecycle

```mermaid
flowchart LR
    A["PLACED"] --> B["PACKED"]
    B --> C["SHIPPED"]
    C --> D["DELIVERED"]
```

Customers can cancel eligible unpaid orders.

Vendors manage the order lifecycle for their own orders.

## 11. Infrastructure and Ports

| Component | Port |
|---|---:|
| React Frontend | 5173 |
| API Gateway | 8000 |
| Auth Service | 3001 |
| Vendor Service | 3002 |
| Product Service | 3003 |
| Cart Service | 3004 |
| Order Service | 3005 |
| Payment Service | 3006 |
| Redis | 6379 |

## 12. Future Enhancements

- Automated vendor payouts using Razorpay Route.
- Production cloud deployment.
- Automated integration testing.
- Advanced marketplace analytics.
- Centralized logging and monitoring.
- Improved distributed transaction handling.
```
