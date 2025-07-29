# Component Organization Philosophy

### `/components/` Directory Structure

```
/components/
├── ui/                     # Pure shadcn/ui framework components
├── providers/              # Global context providers (ThemeProvider, SuggestionProvider, etc.)
├── shared/                 # Simple reusable components across contexts
├── layout/                 # Main structural application layout (e.g., left-sidebar, middle-content, right-sidebar)
├── messages/               # Universal message handling & input
├── mentions/               # Entity mention system components (e.g., SuggestionPopup)
├── dialogs/                # Custom application-specific dialogs
└── ...feature-specific/    # Other feature-based directories (e.g., ai/)
```

### `/packages/` Directory Structure

```
/packages/
├── richline-editor/        # The core rich text editor component
├── db/                     # Drizzle ORM schema and database utilities
└── lib/                    # Shared libraries and utilities
```

### Organizational Principles

#### 1. Scope-Based Organization
Components are organized by **scope and usage context**, not implementation details:
- **Global scope**: `/ui/`, `/providers/`, `/shared/`
- **Layout scope**: `/layout/` with clear visual hierarchy (e.g., `left-sidebar`, `middle-content`, `right-sidebar`)
- **Feature scope**: `/messages/`, `/mentions/`, `/ai/`
- **Interaction Scope**: `/dialogs/` for application-specific modals and pop-ups.

#### 2. Usage-Driven Naming
Directory names reflect **what they're used for**, not how they're built:
- ✅ `/packages/richline-editor/` - The core rich text editor, used for documents, messages, etc.
- ✅ `/messages/` - Handles messaging across AI chats, channels, DMs
- ✅ `/mentions/` - Manages entity mentions across all contexts
- ❌ `/chat/` - Ambiguous, conflicts with API terminology

#### 3. Framework vs Application Separation
Clear separation between framework components and application logic:
- **Framework components** (`/ui/`): Pure shadcn/ui, no application logic
- **Application components** (other directories): Custom logic, business rules
- **Core Packages** (`/packages/`): Reusable, isolated packages with their own dependencies.

#### 4. Future-Proof Structure
Organization anticipates growth and new features:
- The `richline-editor` package can be used for any rich text editing needs.
- Message components handle forums, notifications, any messaging.
- Mention system supports new entity types without restructuring.
- `workspace-selector.tsx` is the file for the `DriveSwitcher` component, located under `left-sidebar/`.
- Page settings components like `ShareDialog` and `PermissionsList` are located under `middle-content/content-header/page-settings/`.
- The `PageType` enum includes `DOCUMENT`, `FOLDER`, `CHANNEL`, `AI_CHAT`, and `NOTE`. The `DATABASE` page type is deprecated.