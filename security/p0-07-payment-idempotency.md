# P0-07 Payment Idempotency

Payment verification and Razorpay `payment.captured` webhooks must converge on one successful payment transition and one linked fee-payment record. Concurrent/repeated callbacks must not create duplicate fee payments or regress a successful payment to failed.