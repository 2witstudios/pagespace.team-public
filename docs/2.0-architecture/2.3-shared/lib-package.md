# @pagespace/lib - Shared Utilities

This package contains cross-application business logic and shared utilities.

```typescript
// Cross-application business logic
export * from './src/types';           // Common TypeScript types
export * from './src/auth-utils';      // JWT & authentication helpers
export * from './src/encryption-utils';// Encryption and decryption utilities
export * from './src/page-content-parser'; // Page content parsing utilities
export * from './src/permissions';     // Permission checking logic
export * from './src/tree-utils';      // Page hierarchy utilities
export * from './src/utils';           // General-purpose helpers
export * from './src/enums';           // Shared enums
```

### Responsibilities:
- Shared TypeScript types and interfaces
- Authentication and JWT utilities
- Encryption and decryption utilities
- Page content parsing
- Permission checking and access control logic
- Page tree manipulation and hierarchy utilities
- General-purpose utility functions
- Shared enum definitions

### Dependency Philosophy:
- Minimal external dependencies (jose for JWT)
- No framework-specific code (works in both Next.js and Socket.IO contexts)
- Pure TypeScript/JavaScript utilities