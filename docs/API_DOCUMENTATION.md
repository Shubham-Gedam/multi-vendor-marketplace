
# API Documentation

## 1. Auth Service

**Service Port:** 3001

**Gateway Base URL:** `http://localhost:8000/api/auth`

Authentication is handled using JWT stored in an HTTP-only cookie.

### 1.1 Register Customer

- **Method:** POST
- **Endpoint:** `/register`
- **Authentication:** Not required
- **Description:** Registers a new customer account.

### 1.2 Login

- **Method:** POST
- **Endpoint:** `/login`
- **Authentication:** Not required
- **Description:** Authenticates a user and establishes a login session.

### 1.3 Get Current User

- **Method:** GET
- **Endpoint:** `/me`
- **Authentication:** Required (HTTP-only JWT cookie)
- **Description:** Returns the currently authenticated user's information.

### 1.4 Vendor Test

- **Method:** GET
- **Endpoint:** `/vendor-test`
- **Authentication:** Required
- **Authorization:** VENDOR role
- **Description:** Vendor role access test route.

**Implementation note:** This route currently has no final controller or response handler in the supplied route definition. Its completion needs verification.

### 1.5 Update User Role (Internal)

- **Method:** PATCH
- **Endpoint:** `/internal/users/role`
- **Authentication:** Internal service authorization handled by the controller.
- **Description:** Updates a user's role through an internal service request.

### 1.6 Logout

- **Method:** POST
- **Endpoint:** `/logout`
- **Authentication:** Not required at the router level.
- **Description:** Logs out the user and clears the authentication session.

### 1.7 Refresh Authentication

- **Method:** POST
- **Endpoint:** `/refresh`
- **Authentication:** Required (HTTP-only JWT cookie)
- **Description:** Refreshes the authentication session and issues an updated JWT cookie.

**Note:** Protected endpoints use the HTTP-only JWT cookie. Do not expose authentication tokens in frontend local storage.

## 2. Vendor Service

**Service Port:** 3002

**Description:** Handles vendor applications, application status, and admin approval.

### 2.1 Apply for Vendor Account

- **Method:** POST
- **Endpoint:** `/apply`
- **Authentication:** Required
- **Authorization:** CUSTOMER
- **Description:** Allows customers to submit a vendor application.

**Request Body:**

```json
{
  "businessName": "Electronics Store",
  "businessEmail": "business@example.com",
  "phone": "9876543210",
  "description": "Electronics and accessories store",
  "address": {
    "street": "Main Road",
    "city": "Pune",
    "state": "Maharashtra",
    "pincode": "411001",
    "country": "India"
  }
}
```

### 2.2 Get My Vendor Application

- **Method:** GET
- **Endpoint:** `/my-application`
- **Authentication:** Required
- **Description:** Retrieves the authenticated user's vendor application and its current status.

### 2.3 Update Vendor Application Status

- **Method:** PATCH
- **Endpoint:** `/:vendorId/status`
- **Authentication:** Required
- **Authorization:** ADMIN
- **Description:** Approves or rejects a vendor application.

**Request Body:**

```json
{
  "status": "APPROVED"
}
```

Allowed status values:
-APPROVED
-REJECTED

The service also synchronizes the user's role with Auth Service.

### 2.4 Get All Vendor Applications

- **Method:** GET
- **Endpoint:** `/admin/all`
- **Authentication:** Required
- **Authorization:** ADMIN
- **Description:** Retrieves all vendor applications, sorted by creation date.

### Vendor Application Status Flow

1. Customer submits a vendor application.
2. Application is saved with PENDING status.
3. Admin reviews the application.
4. Admin approves or rejects it.
5. Auth Service role is synchronized.

## 3. Product Service

**Service Port:** 3003

**Gateway Base URL:** `http://localhost:8000/api/products`

**Description:** Handles product management, image uploads, product search, and customer reviews.

### 3.1 Get All Products

- Method: GET
- Endpoint: `/`
- Authentication: Not required
- Description: Retrieves all active products.

### 3.2 Get Single Product

- Method: GET
- Endpoint: `/:productId`
- Authentication: Not required
- Description: Retrieves details of a single active product.

### 3.3 Create Product

- Method: POST
- Endpoint: `/`
- Authentication: Required
- Authorization: Approved Vendor
- Content-Type: multipart/form-data
- Description: Creates a new product and supports up to 5 product images.

### 3.4 Update Product

- Method: PATCH
- Endpoint: `/:productId`
- Authentication: Required
- Authorization: Approved Vendor
- Content-Type: multipart/form-data
- Description: Updates an existing vendor-owned product.

### 3.5 Delete Product

- Method: DELETE
- Endpoint: `/:productId`
- Authentication: Required
- Authorization: Approved Vendor
- Description: Deletes a vendor-owned product.

### Product Reviews

### 3.6 Get Product Reviews

- Method: GET
- Endpoint: `/:productId/reviews`
- Authentication: Not required
- Description: Retrieves all reviews for a product.

### 3.7 Create Product Review

- Method: POST
- Endpoint: `/:productId/reviews`
- Authentication: Required
- Description: Creates a product review.

### 3.8 Update Own Review

- Method: PATCH
- Endpoint: `/reviews/:reviewId`
- Authentication: Required
- Description: Updates the authenticated user's review.

### 3.9 Delete Own Review

- Method: DELETE
- Endpoint: `/reviews/:reviewId`
- Authentication: Required
- Description: Deletes the authenticated user's review.

### 3.10 Get Own Product Review

- Method: GET
- Endpoint: `/reviews/my/:productId`
- Authentication: Required
- Description: Retrieves the authenticated user's review for a product.

### 3.11 Search Products

- **Method:** GET
- **Endpoint:** `/search/products`
- **Authentication:** Not required
- **Query Parameters:**
  - `q` — Search keyword
  - `sort` — Sorting option
  - `category` — Product category
  - `minPrice` — Minimum price
  - `maxPrice` — Maximum price
  - `minRating` — Minimum rating

- **Description:** Searches products using Elasticsearch with filtering and sorting.

### Product Management Notes

- Product images are uploaded using AWS S3.
- Image upload field name: `images`.
- Maximum images per upload request: 5.
- Only approved vendors can create, update, and delete products.
- Products support Elasticsearch-based search and filtering.

## 4. Cart Service

**Service Port:** 3004

**Gateway Base URL:** `http://localhost:8000/api/cart`

**Description:** Manages customer shopping carts using Redis caching.

All Cart Service endpoints require authentication.

### 4.1 Add Product to Cart

- Method: POST
- Endpoint: `/`
- Authentication: Required
- Description: Adds a product to the authenticated customer's cart.

### 4.2 Get Shopping Cart

- Method: GET
- Endpoint: `/`
- Authentication: Required
- Description: Retrieves all products in the authenticated customer's cart.

### 4.3 Update Cart Quantity

- Method: PATCH
- Endpoint: `/:productId`
- Authentication: Required
- Description: Updates the quantity of a particular cart product.

### 4.4 Remove Product from Cart

- Method: DELETE
- Endpoint: `/:productId`
- Authentication: Required
- Description: Removes a particular product from the customer's cart.

### 4.5 Clear Shopping Cart

- Method: DELETE
- Endpoint: `/`
- Authentication: Required
- Description: Removes all products from the authenticated customer's cart.

### Cart Management Notes

- Redis is used for cart caching.
- Each authenticated customer has an individual cart.
- Customers can add products from multiple vendors.
- Cart data is used by Order Service during checkout.

## 5. Order Service

**Service Port:** 3005

**Gateway Base URL:** `http://localhost:8000/api/orders`

**Description:** Handles multi-vendor checkout, order creation, coupon management, order tracking, invoices, and payment status synchronization.

### Customer APIs

#### 5.1 Create Orders

- Method: POST
- Endpoint: `/`
- Authentication: Required
- Authorization: CUSTOMER
- Description: Creates separate vendor-specific orders from the customer's shopping cart using a common checkout ID.

#### 5.2 Get My Orders

- Method: GET
- Endpoint: `/my-orders`
- Authentication: Required
- Authorization: CUSTOMER
- Description: Retrieves all orders belonging to the authenticated customer.

#### 5.3 Get Order Details

- Method: GET
- Endpoint: `/:orderId`
- Authentication: Required
- Authorization: CUSTOMER
- Description: Retrieves details of a specific customer-owned order.

#### 5.4 Cancel Order

- Method: PATCH
- Endpoint: `/:orderId/cancel`
- Authentication: Required
- Authorization: CUSTOMER
- Description: Cancels an eligible unpaid order.

#### 5.5 Download Order Invoice

- Method: GET
- Endpoint: `/:orderId/invoice`
- Authentication: Required
- Authorization: CUSTOMER
- Description: Generates or downloads the invoice for an order.

#### 5.6 Validate Coupon

- Method: POST
- Endpoint: `/coupons/validate`
- Authentication: Required
- Authorization: CUSTOMER
- Description: Validates a coupon and calculates the applicable discount.

### Vendor APIs

#### 5.7 Get Vendor Orders

- Method: GET
- Endpoint: `/vendor/my-orders`
- Authentication: Required
- Authorization: VENDOR
- Description: Retrieves orders associated with the authenticated vendor.

#### 5.8 Update Order Status

- Method: PATCH
- Endpoint: `/:orderId/status`
- Authentication: Required
- Authorization: VENDOR
- Description: Updates an eligible vendor order's delivery status.

Supported order lifecycle:

- PLACED
- PACKED
- SHIPPED
- DELIVERED

### Admin APIs

#### 5.9 Create Coupon

- Method: POST
- Endpoint: `/admin/coupons`
- Authentication: Required
- Authorization: ADMIN
- Description: Creates a discount coupon.

#### 5.10 Get All Coupons

- Method: GET
- Endpoint: `/admin/coupons`
- Authentication: Required
- Authorization: ADMIN
- Description: Retrieves all available coupons.

#### 5.11 Update Coupon

- Method: PATCH
- Endpoint: `/admin/coupons/:couponId`
- Authentication: Required
- Authorization: ADMIN
- Description: Updates an existing coupon.

#### 5.12 Get All Orders

- Method: GET
- Endpoint: `/admin/all`
- Authentication: Required
- Authorization: ADMIN
- Description: Retrieves all marketplace orders.

### Internal Service APIs

#### 5.13 Update Order Payment Status

- Method: PATCH
- Endpoint: `/internal/:orderId/payment-status`
- Authentication: Internal service key
- Description: Allows Payment Service to update an order's payment status after successful payment verification.

Required Header:

`x-internal-service-key`

#### 5.14 Get Checkout Vendor Orders

- Method: GET
- Endpoint: `/internal/checkouts/:checkoutId/orders`
- Authentication: Internal service key
- Description: Retrieves all vendor-specific orders belonging to a checkout.

Query Parameter:

`customerId`

Required Header:

`x-internal-service-key`

### Multi-Vendor Order Management

- Cart items are grouped according to vendor ID.
- Separate orders are created for each vendor.
- All vendor orders share a common checkout ID.
- Coupon discounts are allocated proportionally.
- One combined payment can cover multiple vendor orders.
- Payment status is synchronized across the related vendor orders.

## 6. Payment Service

**Service Port:** 3006

**Gateway Base URL:** `http://localhost:8000/api/payments`

**Description:** Handles Razorpay payments, combined multi-vendor checkout payments, payment verification, webhooks, and payment analytics.

### 6.1 Create Single Order Payment

- Method: POST
- Endpoint: `/create-order`
- Authentication: Required
- Authorization: CUSTOMER
- Description: Creates a Razorpay payment order for a single vendor order.

**Request Body:**

```json
{
  "orderId": "ORDER_ID"
}
```

### 6.2 Create Combined Checkout Payment

- Method: POST
- Endpoint: `/create-checkout-payment`
- Authentication: Required
- Authorization: CUSTOMER
- Description: Creates one Razorpay payment for multiple vendor-specific orders belonging to the same checkout.

**Request Body:**

```json
{
  "checkoutId": "CHECKOUT_ID"
}
```

### 6.3 Verify Single Order Payment

- Method: POST
- Endpoint: `/verify`
- Authentication: Required
- Authorization: CUSTOMER
- Description: Verifies Razorpay payment signature and synchronizes the corresponding order payment status.

**Request Body:**

```json
{
  "razorpay_order_id": "RAZORPAY_ORDER_ID",
  "razorpay_payment_id": "RAZORPAY_PAYMENT_ID",
  "razorpay_signature": "RAZORPAY_SIGNATURE"
}
```

### 6.4 Verify Combined Checkout Payment

- Method: POST
- Endpoint: `/verify-checkout`
- Authentication: Required
- Authorization: CUSTOMER
- Description: Verifies a single Razorpay transaction and updates all vendor orders belonging to the checkout as PAID.

**Request Body:**

```json
{
  "razorpay_order_id": "RAZORPAY_ORDER_ID",
  "razorpay_payment_id": "RAZORPAY_PAYMENT_ID",
  "razorpay_signature": "RAZORPAY_SIGNATURE"
}
```

### 6.5 Get Customer Payment History

- Method: GET
- Endpoint: `/my-payments`
- Authentication: Required
- Authorization: CUSTOMER
- Description: Retrieves the authenticated customer's single and combined payment records.

### 6.6 Get All Payments (Admin)

- Method: GET
- Endpoint: `/admin/all`
- Authentication: Required
- Authorization: ADMIN
- Description: Retrieves marketplace payment records, total sales, platform commission, and calculated vendor earnings.

### 6.7 Razorpay Webhook

- Method: POST
- Endpoint: `/webhook`
- Authentication: Razorpay webhook signature verification
- Description: Receives asynchronous Razorpay payment events and synchronizes payment records and order statuses.

**Supported Events:**

- `payment.captured`
- `payment.failed`

**Required Headers:**

- `x-razorpay-signature`
- `x-razorpay-event-id`

**Important:** The webhook route is registered directly in the Payment Service `app.js`, separately from `payment.routes.js`. It receives the raw JSON request body for signature verification.

### Payment Processing Notes

- Razorpay Test Mode is used for payment testing.
- Single-vendor payments are stored in the `payments` collection.
- Combined multi-vendor payments are stored in the `checkoutpayments` collection.
- Payment amounts are stored in paise.
- Razorpay signatures are verified before marking payments as PAID.
- Webhook events are stored in the `webhookevents` collection.
- Combined checkout payments maintain separate vendor order allocations.
- Platform commission and vendor earnings are calculated internally.
- Actual vendor bank payouts require a separate payout integration.

## 7. API Gateway

**Service Port:** 8000

**Description:** Acts as the central entry point for frontend API requests and forwards requests to the appropriate microservice.

### Gateway Endpoints

| Microservice | Gateway Prefix | Target Service |
| Auth Service | `/api/auth` | Auth Service |
| Vendor Service | `/api/vendors` | Vendor Service |
| Product Service | `/api/products` | Product Service |
| Cart Service | `/api/cart` | Cart Service |
| Order Service | `/api/orders` | Order Service |
| Payment Service | `/api/payments` | Payment Service |

### Gateway Health Check

- Method: GET
- Endpoint: `/health`
- Authentication: Not required
- Description: Checks whether the API Gateway is running.

### Gateway Features

- Centralized request routing.
- HTTP proxy middleware.
- CORS configuration.
- Cookie-based credential support.
- Microservice connection error handling.
- Invalid route handling.
- Separate service URL configuration through environment variables.

### Error Handling

**502 Bad Gateway:** Returned when a target microservice is unavailable.

**404 Not Found:** Returned when an API Gateway route does not exist.

### Environment Configuration

The API Gateway uses the following environment variables:

- `FRONTEND_URL`
- `AUTH_SERVICE_URL`
- `VENDOR_SERVICE_URL`
- `PRODUCT_SERVICE_URL`
- `CART_SERVICE_URL`
- `ORDER_SERVICE_URL`
- `PAYMENT_SERVICE_URL`
