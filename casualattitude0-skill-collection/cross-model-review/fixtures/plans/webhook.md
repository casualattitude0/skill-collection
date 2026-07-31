# Plan: payment provider webhooks

## Goal

Keep our order records in sync with the payment provider by consuming its
webhooks.

## Events we care about

- `charge.succeeded` — mark the order paid, send the receipt email.
- `charge.refunded` — mark the order refunded, restock the items.
- `charge.failed` — mark the order failed.

## Implementation

1. Expose `POST /webhooks/payments`.
2. Verify the signature header against our webhook secret.
3. Parse the event and switch on `event.type`.
4. Look up the order by `event.data.order_id`.
5. Apply the state change and return `200`.

## Notes

The provider retries on any non-2xx response, so we return `200` as soon as we
have written the state change.
