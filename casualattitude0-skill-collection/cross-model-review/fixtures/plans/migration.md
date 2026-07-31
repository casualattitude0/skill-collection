# Plan: split `users.name` into `first_name` / `last_name`

## Goal

The `users` table stores a single `name` column. Reporting needs the parts
separately.

## Implementation

1. Add nullable `first_name` and `last_name` columns.
2. Run a backfill that splits `name` on the first space: everything before it
   is `first_name`, everything after is `last_name`.
3. Deploy the application change that writes both new columns and reads from
   them.
4. Drop the `name` column.

## Notes

The backfill is a single `UPDATE` over the table. There are about 4 million
rows. We will run it during the Tuesday deploy window.
