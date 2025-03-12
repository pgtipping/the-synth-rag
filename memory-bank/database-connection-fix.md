# Database Connection Fix - May 29, 2024

## Issue

The application was encountering a database connection error when trying to upload files:

```
Upload error: error: password authentication failed for user "username"
```

The error occurred in the document service when trying to connect to the PostgreSQL database:

```typescript
const client = await this.pool.connect();
```

## Root Cause

The issue was caused by special characters in the database password. The connection string in the .env file was:

```
DATABASE_URL=postgres://postgres:Pgpostgres@24@localhost:5432/RAG_test
```

The `@` symbol in the password (`Pgpostgres@24`) was causing confusion in the URL parsing, as `@` is also used as a separator in the connection string format.

## Solution

The solution was to URL-encode the special characters in the password:

```
DATABASE_URL=postgres://postgres:Pgpostgres%4024@localhost:5432/RAG_test
```

The `@` symbol was encoded as `%40`, which is the URL-encoded representation of the `@` character.

## Lessons Learned

1. Always URL-encode special characters in database connection strings
2. Common special characters that need encoding:

   - `@` → `%40`
   - `:` → `%3A`
   - `/` → `%2F`
   - `?` → `%3F`
   - `#` → `%23`
   - `&` → `%26`
   - `=` → `%3D`
   - `+` → `%2B`
   - ` ` (space) → `%20`

3. When troubleshooting database connection issues, always check for special characters in the connection string

## Implementation

The fix was implemented by updating the .env file with the properly encoded connection string:

```diff
- DATABASE_URL=postgres://postgres:Pgpostgres@24@localhost:5432/RAG_test
+ DATABASE_URL=postgres://postgres:Pgpostgres%4024@localhost:5432/RAG_test
```

After this change, the application was able to connect to the database successfully.
