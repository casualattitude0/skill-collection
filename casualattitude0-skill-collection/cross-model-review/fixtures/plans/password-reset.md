# Plan: password reset by email link

## Goal

A user who has forgotten their password can set a new one via an emailed link.

## Implementation

1. `POST /password/forgot` takes an email address.
2. If an account exists, generate a token and store it on the `users` row in a
   `reset_token` column.
3. Email the user a link to `/password/reset?token=<token>`.
4. `GET /password/reset` looks the token up and renders the new-password form.
5. `POST /password/reset` validates the token, writes the new password hash,
   and signs the user in.

## Notes

The token is a random 32-character string. If no account exists for the address
we return `404` so the user knows to sign up instead.
