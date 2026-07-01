#!/bin/bash
# Move to package directories and run pnpm format
cd "$(dirname "$0")/../../api" && pnpm format
cd "$(dirname "$0")/../../expo-app" && pnpm format
exit 0
