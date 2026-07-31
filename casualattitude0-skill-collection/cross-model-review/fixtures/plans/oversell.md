# Plan: order placement

## Goal

Let a signed-in customer place an order for items in their cart.

## Requirements

- The customer sees a confirmation page with an order number.
- Stock is decremented when the order is placed.
- **The same unit must never be sold to two customers.**
- Payment is captured before the order is confirmed.

## Implementation

1. `POST /orders` reads the cart and looks up each item's `stock_count`.
2. If every item has `stock_count > 0`, create an `orders` row with status
   `pending`.
3. Call the payment provider to capture the charge.
4. On success, set the order status to `confirmed` and decrement `stock_count`
   for each item.
5. Render the confirmation page.

## Out of scope

- Partial shipments.
- Back-orders — if stock is zero the customer sees "unavailable".
