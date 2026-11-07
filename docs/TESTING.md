
# Marketly — Testing Documentation

## 1. Testing Overview

Marketly was manually tested to verify its core multi-vendor marketplace functionality, including authentication, vendor approval, product management, shopping cart, checkout, payments, and order management.

## 2. Functional Testing

| Test Case | Expected Result | Status |
| Customer Registration | Customer account created | PASS |
| Customer Login | User successfully logged in | PASS |
| Vendor Application | Application submitted | PASS |
| Vendor Approval | Admin approves vendor | PASS |
| Vendor Login | Approved vendor can log in | PASS |
| Product Creation | Vendor creates product | PASS |
| Product Image Upload | Images uploaded to AWS S3 | PASS |
| Product Visibility | Customer sees vendor products | PASS |
| Multi-Vendor Cart | Products from different vendors appear together | PASS |
| Coupon Application | Coupon discount calculated | PASS |
| Multi-Vendor Order Creation | Separate vendor orders created | PASS |
| Single Razorpay Payment | One payment covers multiple vendor orders | PASS |
| Payment Verification | Payment status updated to PAID | PASS |
| Vendor Order Visibility | Each vendor sees its own orders | PASS |
| Order Lifecycle | Orders progress to DELIVERED | PASS |
| Razorpay Webhook | Captured payment event processed | PASS |

## 3. Multi-Vendor Checkout Test

### Test Scenario

A customer purchases products from two different vendors in a single checkout.

### Test Data

| Product | Original Price |
| Computer Keyboard | ₹1,200 |
| Wireless Headphones | ₹2,300 |
| Total Subtotal | ₹3,500 |
| Coupon Discount | ₹400 |
| Final Payment | ₹3,100 |

### Expected Results

- One Razorpay checkout is opened.
- One combined payment is created.
- Two separate vendor orders are generated.
- Both orders receive PAID payment status.
- Each vendor can access its own order.
- Both orders can progress through the delivery lifecycle.

### Observed Results

The multi-vendor checkout was manually tested successfully.

Both vendor orders were visible in the customer and respective vendor accounts. Both orders reached DELIVERED status.

## 4. Payment Testing

Payment integration was tested using Razorpay Test Mode.

Verified functionality:

- Razorpay order creation.
- Combined checkout payment.
- Payment signature verification.
- Platform commission calculation.
- Vendor-wise earning allocation.
- Razorpay webhook signature verification.
- Captured payment webhook processing.

## 5. Webhook Testing

| Event | Expected Result | Observed Result |
|---|---|---|
| payment.captured | Payment event processed | PROCESSED |
| Duplicate event | Already processed event ignored | Implemented; separate duplicate-event test pending |
| payment.failed | Payment marked FAILED | Implemented; test pending |

## 6. Database Verification

The following MongoDB collections were verified:

| Collection | Purpose |
| users | User accounts |
| vendors | Vendor applications |
| products | Product records |
| orders | Vendor-specific orders |
| payments | Single-vendor payment records |
| checkoutpayments | Combined checkout payments |
| webhookevents | Razorpay webhook events |

Redis is used for shopping cart caching.

## 7. Pending Verification

- Commission rounding after the latest code correction.
- Failed payment webhook testing.
- Automated integration test coverage.
- Production deployment testing.
- Actual vendor bank payouts.

## 8. Testing Conclusion

Manual testing confirmed the core multi-vendor marketplace workflow, including separate vendor orders, a single combined Razorpay payment, payment verification, vendor-specific order visibility, and order delivery tracking.

Automated testing and production deployment remain future work.

## 9. Local Razorpay Webhook Testing

Razorpay requires a publicly accessible HTTPS endpoint to deliver webhook events.

### Step 1: Start Payment Service

```bash
cd payment-service
npm run dev

Open a separate PowerShell terminal and run:

cloudflared tunnel --url http://localhost:3006


Copy the generated Cloudflare HTTPS URL:

https://YOUR_CLOUDFLARE_URL/api/payments/webhook
