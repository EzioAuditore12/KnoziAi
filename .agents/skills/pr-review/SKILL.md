---
name: pr-review
description: Reviews pull requests for code quality. Use when reviewing PRs or checking code changes.
allowed-tools: Read, Grep, Glob, Bash
model: gemini-flash-lite
---

When reviewing code in this monorepo, apply the relevant patterns based on the directory:

## 1. NestJS API (`/api` directory)
- **Consistent patterns** - Follow the existing controller/service/module/DTO architecture.
- **Validation** - Ensure input is validated using `class-validator` decorators in DTOs.

## 2. Expo App (`/expo-app` directory)
- **Consistent patterns** - Follow React Native and Expo Router conventions. Keep screens simple and move logic to custom hooks or services.
- **UI & Styling** - Use the established UI components rather than building from scratch or using inline styles.

## General Code Quality (Both)
1. **Readability and clear naming** - Variables, functions, and classes should have descriptive names.
2. **No hardcoded secrets** - Ensure API keys, tokens, and secrets use environment variables.
