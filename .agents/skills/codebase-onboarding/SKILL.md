---
name: codebase-onboarding
description: Provides an onboarding overview of the codebase architecture, particularly the authentication flow. Use this when you need context about how the app works.
---

This skill provides information about the KnoziAi codebase architecture.

## Architecture

This project is a monorepo consisting of:
1. **NestJS API** (`/api`): The backend server.
2. **Expo App** (`/expo-app`): The React Native client.

## Detailed References
For complex systems, we use progressive disclosure to keep instructions concise. Read the detailed reference documents below as needed:

- **Authentication Flow (JWT)**: Please review [auth.md](file:///c:/Development/KnoziAi/.agents/skills/codebase-onboarding/references/auth.md) to understand how the client and server handle sessions, JWT tokens, and automatic token refreshes.
