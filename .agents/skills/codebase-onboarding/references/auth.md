# Authentication Flow

The KnoziAi monorepo uses a JWT-based authentication system to manage sessions securely between the Expo client and the NestJS server.

## Client (Expo App)
- **State Management**: The client stores the JWT tokens (`accessToken` and `refreshToken`) in a Zustand store (`useAuthStore`).
- **Authenticated Requests**: All authenticated API requests are made using the custom `executeAuthenticatedRequest` wrapper (located in `src/lib/auth-fetch/executor.ts`).
- **Token Injection**: The wrapper automatically retrieves the `accessToken` from the Zustand store and injects it into the `Authorization: Bearer <token>` HTTP header.
- **Automatic Refresh Mechanism**: If the NestJS server returns a `401 Unauthorized` response (indicating the access token has expired), the executor automatically pauses the request and attempts a silent token refresh using the `refreshAccessToken` utility. 
  - If the refresh is successful, it updates the store and retries the original request with the new access token. 
  - If the refresh fails (e.g., the refresh token is also expired), it alerts the user that the session has expired and prompts them to log in again.

## Server (NestJS API)
- **Validation**: The backend validates incoming JWTs on protected routes using guards (`JwtAuthGuard`).
- **Token Issuance & JWKS**: Instead of hardcoded string secrets, JWTs are signed using dynamic asymmetric keys generated and managed by the `jwksService`. A unique `jti` is injected into payloads to prevent token collisions.
- **Password Hashing**: User passwords are securely hashed using `argon2` before being saved to the database.
- **Rate Limiting**: Sensitive endpoints such as `/auth/login`, `/auth/register`, and `/auth/refresh` are protected against brute-force attacks using the `@Throttle()` decorator.
- **Refresh Rotation**: When tokens are refreshed, the old refresh token is immediately invalidated (Refresh Token Rotation) to prevent replay attacks.
