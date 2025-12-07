# Login Attempt Limiting

## Overview

This feature implements server-side login attempt limiting to prevent brute force attacks on user accounts. After a configurable number of failed login attempts, the account is temporarily locked out.

## Configuration

- **Maximum Attempts**: 5 failed login attempts
- **Lockout Duration**: 15 minutes (900 seconds)
- **Storage**: In-memory Map (suitable for single-instance deployments)
- **Tracking Method**: Email address (case-insensitive)

## Behavior

### Failed Login Attempts

1. User enters incorrect credentials
2. System records the failed attempt for that email address
3. System returns error message with remaining attempts count
4. Example response:
   ```json
   {
     "error": "Invalid email or password.",
     "remaining": 4
   }
   ```

### Account Lockout

After 5 failed attempts:
1. Account is temporarily locked for 15 minutes
2. All login attempts during lockout return:
   ```json
   {
     "error": "Too many failed login attempts. Please try again in 15 minute(s)."
   }
   ```
3. Lockout time decreases as time passes

### Successful Login

When a user successfully logs in:
1. All failed attempt records for that email are cleared
2. User can make new login attempts with full quota (5 attempts)

## Implementation Details

### Files Modified

- **`/lib/loginAttempts.ts`**: Core tracking service
  - `recordFailedAttempt(email)`: Records a failed login attempt
  - `isLockedOut(email)`: Checks if an email is currently locked out
  - `getRemainingAttempts(email)`: Returns number of attempts left before lockout
  - `getRemainingLockoutTime(email)`: Returns seconds until lockout expires
  - `resetAttempts(email)`: Clears all attempts (called on successful login)

- **`/routes/login.ts`**: Login route handler
  - Added lockout check before authentication
  - Records failed attempts
  - Resets attempts on success
  - Returns appropriate error messages

### Security Considerations

1. **Case-Insensitive Tracking**: Email addresses are normalized to lowercase to prevent bypass attempts using different cases
2. **Temporary Lockout**: Accounts are never permanently blocked, only temporarily locked
3. **Automatic Expiry**: Lockouts automatically expire after the configured duration
4. **No Enumeration**: Error messages don't reveal whether an account exists

## Limitations

### In-Memory Storage

The current implementation uses an in-memory Map for simplicity. This means:
- State is lost on server restart
- Not suitable for multi-instance deployments without session affinity
- For production use with multiple instances, consider:
  - Redis for distributed state
  - Database-backed storage
  - Sticky sessions / session affinity

## Testing

Tests are available in `/test/api/loginApiSpec.ts` under the section "attempt limiting":

1. **Test failed attempt tracking**: Verifies remaining attempts decrease
2. **Test lockout after 5 attempts**: Verifies lockout is triggered
3. **Test reset on successful login**: Verifies attempts reset after success

## Example Usage

```javascript
// User makes failed login attempt
POST /rest/user/login
{
  "email": "user@example.com",
  "password": "wrongpassword"
}

// Response (attempt 1)
{
  "error": "Invalid email or password.",
  "remaining": 4
}

// After 5 failed attempts:
{
  "error": "Too many failed login attempts. Please try again in 15 minute(s)."
}

// After successful login, attempts are reset
```

## Future Enhancements

Potential improvements for production use:
- Add IP-based rate limiting as an additional layer
- Implement CAPTCHA after N failed attempts
- Add admin interface to view/reset lockouts
- Use persistent storage (Redis/Database)
- Add configurable lockout duration per user role
- Email notifications for lockout events
- Audit logging of failed attempts
