
# Marketly — Database Schema Documentation

## 1. Auth Service Database

**Database:** Auth MongoDB

**Collection:** users

**Model:** User

**Description:** Stores customer, vendor, and admin account information.

### User Schema

| Field | Data Type | Constraints / Default |
| _id | ObjectId | Automatically generated |
| name | String | Required, 2–100 characters |
| email | String | Required, unique, lowercase |
| password | String | Required, minimum 8 characters |
| role | String | CUSTOMER, VENDOR, ADMIN; default CUSTOMER |
| addresses | Array | Default empty array |
| isActive | Boolean | Default true |
| createdAt | Date | Automatically generated |
| updatedAt | Date | Automatically updated |

### Address Subdocument Schema

Each user can store multiple addresses.

| Field | Data Type | Default |
| _id | ObjectId | Automatically generated |
| street | String | Optional |
| city | String | Optional |
| state | String | Optional |
| zip | String | Optional |
| country | String | Optional |
| isDefault | Boolean | false |

### Password Security

- Passwords are hashed using bcryptjs.
- Password hashing runs before saving a modified password.
- Hashing uses 12 salt rounds.
- Password field is excluded from query results by default using `select: false`.
- `comparePassword()` verifies login passwords.

### User Roles

- CUSTOMER: Can browse products and purchase items.
- VENDOR: Can manage products and vendor orders after approval.
- ADMIN: Can manage marketplace operations.

### Database Features

- Mongoose schema validation.
- Unique email constraint.
- Automatic timestamps.
- Embedded address documents.
- Role-based user identification.

## 2. Vendor Service Database

**Database:** Vendor MongoDB

**Collection:** vendors (Mongoose default)

**Model:** Vendor

**Description:** Stores vendor business profiles and application approval information.

### Vendor Schema

| Field | Data Type | Constraints / Default |
| _id | ObjectId | Automatically generated |
| userId | String | Required, unique |
| businessName | String | Required, trimmed |
| description | String | Optional, trimmed |
| businessEmail | String | Required, lowercase, trimmed |
| phone | String | Required, trimmed |
| address | Object | Business address information |
| status | String | PENDING, APPROVED, REJECTED; default PENDING |
| createdAt | Date | Automatically generated |
| updatedAt | Date | Automatically updated |

### Address Subdocument

| Field | Data Type |
| street | String |
| city | String |
| state | String |
| zip | String |
| country | String |

### Vendor Application Status

- PENDING: Application submitted and awaiting admin review.
- APPROVED: Vendor application approved.
- REJECTED: Vendor application rejected.

### User Relationship

- `userId` stores the corresponding Auth Service user ID as a String.
- Each user can have only one vendor profile because `userId` is unique.
- Vendor approval is managed by Admin.
- After approval, the Auth Service user role is synchronized to VENDOR.

### Database Featuress

- Unique user ID constraint.
- Mongoose schema validation.
- Automatic timestamps.
- Vendor application status management.

## 3. Product Service Database

**Database:** Product MongoDB

### 3.1 Products Collection

**Model:** Product

**Collection:** products

**Description:** Stores product information, vendor ownership, pricing, stock, images, and rating summaries.

| Field | Data Type | Constraints / Default |
| _id | ObjectId | Automatically generated |
| vendorId | String | Required, indexed |
| name | String | Required, maximum 200 characters |
| description | String | Required |
| price | Number | Required, minimum 0 |
| category | String | Required |
| brand | String | Optional |
| images | Array of Strings | Default empty array |
| stock | Number | Required, minimum 0, default 0 |
| status | String | ACTIVE / INACTIVE, default ACTIVE |
| averageRating | Number | Default 0, range 0–5 |
| numReviews | Number | Default 0 |
| createdAt | Date | Automatically generated |
| updatedAt | Date | Automatically updated |

### Product Relationships

- `vendorId` stores the ID of the vendor who owns the product.
- Product images are stored using AWS S3 URLs.
- `averageRating` stores the product's calculated average rating.
- `numReviews` stores the total number of product reviews.

### 3.2 Product Reviews Collection

**Model:** ProductReview

**Collection:** productreviews

**Description:** Stores customer ratings and reviews for individual products.

| Field | Data Type | Constraints / Default |
| _id | ObjectId | Automatically generated |
| productId | ObjectId | Required, references Product |
| customerId | String | Required |
| rating | Number | Required, minimum 1, maximum 5 |
| title | String | Required, maximum 100 characters |
| comment | String | Required, maximum 1000 characters |
| createdAt | Date | Automatically generated |
| updatedAt | Date | Automatically updated |

### Product Review Indexes

A compound unique index is created on:

`{ productId: 1, customerId: 1 }`

This ensures that one customer can submit only one review per product.

An additional index is created on `productId` for efficient review retrieval.

### Product Database Features

- Mongoose schema validation.
- Vendor-based product indexing.
- Product rating summaries.
- Unique customer review per product.
- AWS S3 image URL storage.
- Elasticsearch integration for product search.
- Automatic timestamps.

## 4. Cart Service — Redis Data Structure

**Storage:** Redis

**Redis Port:** 6379

**Description:** Stores customer shopping cart information using Redis Hash data structures.

### Redis Key Structure

Each customer has a separate cart key.

**Key Format:**

`cart:{userId}`

Example:

`cart:6aedcd9eee46fc684a0c94f1`

### Redis Hash Structure

- Redis Key: Customer-specific cart key.
- Hash Field: Product ID.
- Hash Value: Product quantity.

Example:

```text
Key: cart:customer123

Field                         Value
productId_1                    2
productId_2                    1
productId_3                    3
```

### Cart Operations

| Operation | Redis Command | Description |
| Add Product | HSET / HGET | Adds product or increases quantity |
| Get Cart | HGETALL | Retrieves all cart items |
| Update Quantity | HSET | Updates product quantity |
| Remove Product | HDEL | Removes a product |
| Clear Cart | DEL | Deletes the customer's cart |

### Cart Data Structure

Each cart item contains:

| Field | Data Type | Description |
| productId | String | Product identifier |
| quantity | Number | Requested product quantity |

### Product Validation

- Product details are verified through Product Service.
- Inactive or unavailable products cannot be added.
- Product quantity is checked against available stock.
- Cart operations are associated with the authenticated customer.

### Cart Database Features

- Redis Hash-based cart storage.
- Separate cart for each customer.
- Fast cart retrieval and updates.
- Product stock validation.
- Multi-vendor cart support.

**Note:** Cart data is stored in Redis rather than a MongoDB collection.

## 5. Order Service — MongoDB Database

**Database:** Order MongoDB

### 5.1 Orders Collection

**Model:** Order

**Collection:** orders

Stores customer orders, vendor-specific order details, shipping information, payment status and order lifecycle.

#### Order Schema

| Field | Data Type | Constraints / Default |
| _id | ObjectId | Automatically generated |
| customerId | String | Required, indexed |
| vendorId | String | Required, indexed |
| items | Array | Required |
| shippingAddress | Object | Required |
| subtotalAmount | Number | Required, minimum 0 |
| discountAmount | Number | Default 0 |
| couponId | ObjectId | References Coupon, default null |
| couponCode | String | Default null |
| checkoutId | String | Default null, indexed |
| totalAmount | Number | Required, minimum 0 |
| orderStatus | String | Default PLACED |
| paymentStatus | String | Default PENDING |
| createdAt | Date | Automatically generated |
| updatedAt | Date | Automatically updated |

#### Order Item Subdocument

| Field | Data Type | Constraints |
| productId | String | Required |
| productName | String | Required |
| price | Number | Required, minimum 0 |
| quantity | Number | Required, minimum 1 |
| subtotal | Number | Required, minimum 0 |

#### Shipping Address Subdocument

| Field | Data Type |
| fullName | String |
| phone | String |
| address | String |
| city | String |
| state | String |
| pincode | String |

#### Order Status Lifecycle

- PLACED
- PACKED
- SHIPPED
- DELIVERED
- CANCELLED

#### Payment Status

- PENDING
- PAID
- FAILED
- REFUNDED

### 5.2 Coupons Collection

**Model:** Coupon

**Collection:** coupons

Stores discount coupon information managed by administrators.

| Field | Data Type | Constraints / Default |
| _id | ObjectId | Automatically generated |
| code | String | Required, unique, uppercase |
| description | String | Optional, default empty |
| discountType | String | PERCENTAGE / FIXED |
| discountValue | Number | Required, minimum 0.01 |
| minOrderAmount | Number | Default 0 |
| maxDiscountAmount | Number | Default null |
| usageLimit | Number | Default null |
| usedCount | Number | Default 0 |
| reservedCount | Number | Default 0 |
| perCustomerLimit | Number | Default 1 |
| startsAt | Date | Default current date |
| expiresAt | Date | Required |
| isActive | Boolean | Default true |
| createdBy | String | Required |
| createdAt | Date | Automatically generated |
| updatedAt | Date | Automatically updated |

#### Coupon Discount Types

- PERCENTAGE: Percentage-based discount.
- FIXED: Fixed amount discount.

### 5.3 Coupon Redemptions Collection

**Model:** CouponRedemption

**Collection:** couponredemptions

Stores coupon reservation and successful redemption information.

| Field | Data Type | Constraints / Default |
| _id | ObjectId | Automatically generated |
| couponId | ObjectId | Required, references Coupon, indexed |
| customerId | String | Required, indexed |
| checkoutId | String | Required |
| orderIds | Array of Strings | Default empty |
| discountAmount | Number | Required, minimum 0 |
| status | String | RESERVED / REDEEMED / RELEASED |
| redeemedAt | Date | Default null |
| createdAt | Date | Automatically generated |
| updatedAt | Date | Automatically updated |

#### Coupon Redemption Indexes

1. Unique compound index: `{ couponId: 1, checkoutId: 1 }`
2. Compound index: `{ couponId: 1, customerId: 1, status: 1 }`

#### Coupon Redemption Lifecycle

- RESERVED: Coupon usage temporarily reserved during checkout.
- REDEEMED: Coupon successfully used.
- RELEASED: Coupon reservation released.

### Order Service Features

- Multiple vendor orders under one checkout.
- Customer and vendor-based order separation.
- Shipping address storage.
- Order lifecycle management.
- Payment status synchronization.
- Coupon validation and discount allocation.
- Coupon usage limits and reservation tracking.
- PDF invoice generation.
- Automatic timestamps.

## 6. Payment Service

**Database:** MongoDB  
**Collections:** `checkoutpayments`, `payments`, `webhookevents`

### 6.1 CheckoutPayment Collection

Stores one combined checkout payment for orders from multiple vendors.

| Field | Type | Description |
| checkoutId | String | Unique checkout identifier; indexed |
| orderIds | String[] | All order IDs included in the checkout |
| customerId | String | Customer who made the checkout; indexed |
| allocations | Array | Vendor-wise payment allocation details |
| amount | Number | Total checkout amount |
| currency | String | Currency code; default `INR` |
| platformCommission | Number | Total platform commission; default `0` |
| vendorAmount | Number | Total amount allocated to vendors; default `0` |
| razorpayOrderId | String | Razorpay order ID; unique and sparse |
| razorpayPaymentId | String | Razorpay payment ID |
| razorpaySignature | String | Razorpay payment signature |
| status | String | `CREATED`, `PAID`, or `FAILED`; default `CREATED` |
| createdAt | Date | Automatically generated creation timestamp |
| updatedAt | Date | Automatically generated update timestamp |

**Allocation Subdocument***

Each allocation stores the payment distribution for an individual vendor order.

| Field | Type | Description |
| orderId | String | Order identifier |
| vendorId | String | Vendor identifier |
| amount | Number | Order allocation amount |
| platformCommission | Number | Platform commission for the order |
| vendorAmount | Number | Amount payable to the vendor |

Allocation subdocuments do not have separate `_id` fields.

### 6.2 Payment Collection

Stores individual order-level payment records.

| Field | Type | Description |
| orderId | String | Unique order identifier; indexed |
| customerId | String | Customer identifier |
| vendorId | String | Vendor identifier |
| amount | Number | Payment amount |
| currency | String | Currency code; default `INR` |
| platformCommission | Number | Platform commission; default `0` |
| vendorAmount | Number | Vendor payable amount; default `0` |
| razorpayOrderId | String | Razorpay order ID; unique and sparse |
| razorpayPaymentId | String | Razorpay payment ID |
| razorpaySignature | String | Razorpay payment signature |
| status | String | `CREATED`, `PAID`, or `FAILED`; default `CREATED` |
| createdAt | Date | Automatically generated creation timestamp |
| updatedAt | Date | Automatically generated update timestamp |

### 6.3 WebhookEvent Collection

Stores Razorpay webhook events to track their processing status and prevent duplicate event processing.

| Field | Type | Description |

| eventId | String | Unique webhook event identifier |
| eventType | String | Type of Razorpay webhook event |
| razorpayPaymentId | String | Related Razorpay payment ID |
| razorpayOrderId | String | Related Razorpay order ID |
| status | String | `RECEIVED`, `PROCESSED`, or `FAILED`; default `RECEIVED` |
| errorMessage | String | Error details, if processing fails |
| createdAt | Date | Automatically generated creation timestamp |
| updatedAt | Date | Automatically generated update timestamp |

**Important Notes:**

- `CheckoutPayment` stores combined checkout payment information and vendor-wise allocations.
- `Payment` stores individual order-level payment information.
- `WebhookEvent` records webhook events and their processing status.
- Unique indexes help prevent duplicate checkout, order payment, and webhook event records.
- Timestamps are automatically managed by Mongoose.
