# Frontend Architecture

The frontend is a modern React application built on Next.js 14 (App Router). It provides the administrative dashboard for monitoring and managing AsyncHub.

## Folder Structure
```
apps/web/
├── public/              # Static assets
├── src/
│   ├── animations/      # GSAP custom hooks (useScrollReveal, etc.)
│   ├── app/             # Next.js Routing
│   │   ├── (auth)/      # Login / Signup pages
│   │   ├── (dashboard)/ # Authenticated App Layout (Sidebar + TopNav)
│   │   └── page.tsx     # Public Landing Page
│   ├── components/      # Reusable UI primitives (shadcn/ui + custom)
│   ├── constants/       # Global constants (e.g., sidebar navigation config)
│   ├── layouts/         # Layout components (AppSidebar, TopNav)
│   ├── lib/             # Utility functions (Tailwind cn, API client)
│   └── providers/       # Global React Contexts (WorkspaceProvider)
```

## Routing & Layouts
- **App Router:** Utilizes Next.js nested layouts. The `(dashboard)` group shares a common layout containing the `AppSidebar` and `TopNav`.
- **Authentication Protection:** Protected routes check for the presence of a JWT token and redirect to `/login` if missing.

## State Management
- **React Query (`@tanstack/react-query`):** Used for all asynchronous server state (fetching jobs, organizations, users). Provides built-in caching, refetching, and loading states.
- **`WorkspaceProvider`:** A custom React Context that manages the "Active Organization" and "Active Project". When a user switches organizations in the sidebar, this provider updates the global state, triggering React Query to refetch data scoped to the new ID.

## User Interface & Design System
- **Tailwind CSS:** The primary styling engine.
- **Radix UI & Shadcn:** Headless accessible components (Dialogs, Dropdowns, Selects) styled with Tailwind for a bespoke, premium look.
- **Dark Mode:** Native support via CSS variables, heavily utilizing sleek dark colors, glassmorphism, and subtle borders.
- **Command Palette:** Integrated using `cmdk` (⌘K) for fast global navigation and resource search.

## Animations
- **GSAP (GreenSock):** Used extensively on the public landing page for high-performance, scroll-linked stagger animations. Custom hooks like `useStaggerFadeIn` and `useScrollReveal` encapsulate complex timeline logic into simple React refs.

## Current Placeholders & Future Improvements
While the core Dashboard, Jobs list, DLQ, and Organizations pages are fully functional, several sidebar routes remain placeholders:
- `/projects` and `/queues`: Awaiting CRUD forms.
- `/workers`: Awaiting backend heartbeat endpoints to display live connected nodes.
- `/analytics`: Awaiting a metrics aggregation endpoint.
- **WebSockets:** The UI currently relies on manual refresh or React Query window-focus refetching. Integrating Socket.io or native WebSockets will allow live updating of job status pills.
