
# Marketly — Multi-Vendor E-Commerce Marketplace

Marketly is a full-stack multi-vendor e-commerce marketplace where multiple vendors can register, manage their products, and sell to customers through a single platform.

Customers can explore products from different vendors, add multiple products to their cart, apply discount coupons, and complete purchases through a single Razorpay payment.

The platform provides separate vendor orders, order tracking, payment verification, and admin management.

## Features

### Authentication & Authorization

- Customer, Vendor, and Admin roles.
- JWT-based authentication using HTTP-only cookies.
- Role-based access control.
- Vendor registration and approval workflow.
- Protected routes and session management using Redis.

### Vendor Management

- Vendor application submission.
- Admin approval and rejection.
- Vendor-specific dashboards.
- Vendor-specific order management.

### Product Management

- Product creation, updating, and deletion.
- AWS S3 product image uploads.
- Elasticsearch product search.
- Category and price filtering.
- Product sorting and pagination.
- Product reviews and ratings.

### Shopping Cart & Checkout

- Redis-based cart caching.
- Add, update, and remove cart items.
- Multi-vendor shopping cart.
- Separate orders for individual vendors.
- Coupon validation and discount allocation.
- Single Razorpay payment for multiple vendor orders.

### Order Management

- Customer order history.
- Vendor-specific order visibility.
- Order lifecycle:
  - PLACED
  - PACKED
  - SHIPPED
  - DELIVERED
- Order cancellation.
- PDF invoice generation.

### Payment Management

- Razorpay Test Mode integration.
- Single and combined checkout payments.
- Payment signature verification.
- Razorpay webhook integration.
- Payment and order status synchronization.
- Platform commission calculation.
- Vendor-wise earnings calculation.

### Coupon Management

- Admin coupon creation and management.
- Percentage and fixed discounts.
- Usage limits.
- Customer-specific usage limits.
- Coupon reservation and redemption tracking.

### Admin Dashboard

- User and vendor management.
- Vendor application approval.
- Product and order management.
- Payment history.
- Sales and commission analytics.
- Vendor earnings calculations.

## Technology Stack

### Frontend

- React.js
- React Router
- Redux / Context API
- Tailwind CSS
- Axios

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- Cookie Parser

### Database & Infrastructure

- Redis
- Elasticsearch
- AWS S3

### Payment Integration

- Razorpay Test Mode
- Razorpay Webhooks

## Microservices Architecture

Marketly follows a microservices architecture with independent backend services.

| Service | Port | Responsibility |

| Frontend | 5173 | React application |
| API Gateway | 8000 | Central API routing |
| Auth Service | 3001 | Authentication and authorization |
| Vendor Service | 3002 | Vendor applications and approvals |
| Product Service | 3003 | Product CRUD, S3 and search |
| Cart Service | 3004 | Shopping cart and Redis caching |
| Order Service | 3005 | Orders, coupons and invoices |
| Payment Service | 3006 | Razorpay payments and webhooks |

Each backend microservice maintains its own MongoDB connection.

## Multi-Vendor Payment Flow

1. Customer adds products from multiple vendors to the cart.
2. Order Service groups cart items by vendor.
3. Separate vendor orders are created using a common checkout ID.
4. Coupon discounts are allocated proportionally across vendor orders.
5. Payment Service creates one combined Razorpay payment.
6. Customer completes one payment.
7. Payment signature is verified.
8. All related vendor orders are updated to PAID.
9. Vendors can manage their individual orders.
10. Razorpay webhooks provide asynchronous payment event processing.

**Note:** Vendor earnings and platform commissions are calculated and stored internally. Actual bank payouts to vendors require a separate payout integration.

## Installation & Setup

### Prerequisites

- Node.js
- MongoDB
- Redis
- Elasticsearch
- AWS S3 account
- Razorpay Test Mode account

### Clone Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd multi-vendor-marketplace
```

### Install Dependencies

Install dependencies inside each service directory:

- frontend
- api-gateway
- auth-service
- vendor-service
- product-service
- cart-service
- order-service
- payment-service

Run:

```bash
npm install
```

### Environment Configuration

Create separate `.env` files for each service.

Configure the required:

- MongoDB connection strings.
- JWT secrets.
- Redis connection.
- Elasticsearch connection.
- AWS S3 credentials.
- Razorpay API credentials.
- Internal service keys.
- Service URLs.
- CORS settings.

Never commit `.env` files or expose private credentials.

### Start Services

Start the infrastructure dependencies first, then run each backend service in its own terminal.

Start:

1. Auth Service
2. Vendor Service
3. Product Service
4. Cart Service
5. Order Service
6. Payment Service
7. API Gateway
8. Frontend

Use the appropriate development command:

```bash
npm run dev
```

## Testing

The application has been tested for:

- Customer and vendor registration.
- Vendor approval.
- Product creation and image uploads.
- Elasticsearch search and filters.
- Multi-vendor cart operations.
- Coupon application and redemption.
- Single payment for multiple vendor orders.
- Razorpay signature verification.
- Webhook event processing.
- Vendor-specific order visibility.
- Order lifecycle updates.
- Admin payment and order management.

## Security

- HTTP-only authentication cookies.
- Role-based authorization.
- Internal service authentication keys.
- Razorpay signature verification.
- Webhook signature verification.
- Redis session management.
- Environment-based secret configuration.

## Future Improvements

- Razorpay Route / automated vendor payouts.
- Advanced analytics.
- Automated testing and monitoring.
- Production deployment.
- Improved logging and error handling.

## Author

**Shubham Gedam*

Full Stack Developer

GitHub: YOUR_GITHUB_PROFILE_URL
