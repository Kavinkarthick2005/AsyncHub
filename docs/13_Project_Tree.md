# Project Tree

This document outlines the complete folder and file structure of the AsyncHub monorepo.

**Legend:**
- ✅ **Implemented:** Fully or partially functional codebase.
- 🚧 **Placeholder:** UI exists but lacks functional backend integration or is stubbed out.
- 📅 **Planned:** Identified in architecture but not yet created.

```text
AsyncHub/
├── apps/
│   ├── api/ ✅ Implemented
│   │   ├── alembic/ ✅ Implemented
│   │   │   ├── versions/ ✅ Implemented
│   │   │   └── env.py ✅ Implemented
│   │   ├── app/ ✅ Implemented
│   │   │   ├── api/ ✅ Implemented
│   │   │   │   ├── deps.py ✅ Implemented
│   │   │   │   └── routes/ ✅ Implemented
│   │   │   │       ├── auth.py ✅ Implemented
│   │   │   │       ├── organizations.py ✅ Implemented
│   │   │   │       ├── projects.py 📅 Planned
│   │   │   │       ├── queues.py 📅 Planned
│   │   │   │       ├── jobs.py 📅 Planned
│   │   │   │       └── workers.py 📅 Planned
│   │   │   ├── core/ ✅ Implemented
│   │   │   │   ├── config.py ✅ Implemented
│   │   │   │   └── security.py ✅ Implemented
│   │   │   ├── db/ ✅ Implemented
│   │   │   │   └── session.py ✅ Implemented
│   │   │   ├── models/ ✅ Implemented
│   │   │   │   ├── base.py ✅ Implemented
│   │   │   │   ├── user.py ✅ Implemented
│   │   │   │   ├── organization.py ✅ Implemented
│   │   │   │   ├── project.py ✅ Implemented
│   │   │   │   ├── queue.py ✅ Implemented
│   │   │   │   └── job.py ✅ Implemented
│   │   │   ├── repositories/ ✅ Implemented
│   │   │   │   ├── base.py ✅ Implemented
│   │   │   │   ├── user_repository.py ✅ Implemented
│   │   │   │   ├── org_repository.py ✅ Implemented
│   │   │   │   └── job_repository.py ✅ Implemented
│   │   │   ├── schemas/ ✅ Implemented
│   │   │   │   ├── user.py ✅ Implemented
│   │   │   │   ├── organization.py ✅ Implemented
│   │   │   │   └── job.py ✅ Implemented
│   │   │   ├── services/ ✅ Implemented
│   │   │   │   ├── auth_service.py ✅ Implemented
│   │   │   │   ├── org_service.py ✅ Implemented
│   │   │   │   └── job_service.py ✅ Implemented
│   │   │   ├── workers/ ✅ Implemented
│   │   │   │   └── runner.py ✅ Implemented
│   │   │   └── main.py ✅ Implemented
│   │   ├── scripts/ ✅ Implemented
│   │   │   └── seed.py ✅ Implemented
│   │   ├── alembic.ini ✅ Implemented
│   │   └── requirements.txt ✅ Implemented
│   └── web/ ✅ Implemented
│       ├── public/ ✅ Implemented
│       ├── src/ ✅ Implemented
│       │   ├── animations/ ✅ Implemented
│       │   │   └── index.ts ✅ Implemented
│       │   ├── app/ ✅ Implemented
│       │   │   ├── (auth)/ ✅ Implemented
│       │   │   │   ├── login/page.tsx ✅ Implemented
│       │   │   │   └── signup/page.tsx ✅ Implemented
│       │   │   ├── (dashboard)/ ✅ Implemented
│       │   │   │   ├── layout.tsx ✅ Implemented
│       │   │   │   ├── dashboard/page.tsx ✅ Implemented
│       │   │   │   ├── jobs/page.tsx ✅ Implemented
│       │   │   │   ├── jobs/[jobId]/page.tsx ✅ Implemented
│       │   │   │   ├── dlq/page.tsx ✅ Implemented
│       │   │   │   ├── organizations/page.tsx ✅ Implemented
│       │   │   │   ├── projects/page.tsx 🚧 Placeholder
│       │   │   │   ├── queues/page.tsx 🚧 Placeholder
│       │   │   │   ├── workers/page.tsx 🚧 Placeholder
│       │   │   │   ├── schedules/page.tsx 🚧 Placeholder
│       │   │   │   ├── workflows/page.tsx 🚧 Placeholder
│       │   │   │   ├── analytics/page.tsx 🚧 Placeholder
│       │   │   │   ├── audit-logs/page.tsx 🚧 Placeholder
│       │   │   │   └── settings/page.tsx 🚧 Placeholder
│       │   │   ├── globals.css ✅ Implemented
│       │   │   ├── layout.tsx ✅ Implemented
│       │   │   └── page.tsx ✅ Implemented
│       │   ├── components/ ✅ Implemented
│       │   │   ├── ui/ ✅ Implemented
│       │   │   ├── create-organization-dialog.tsx ✅ Implemented
│       │   │   ├── empty-state.tsx ✅ Implemented
│       │   │   └── [shadcn components] ✅ Implemented
│       │   ├── constants/ ✅ Implemented
│       │   │   └── navigation.ts ✅ Implemented
│       │   ├── layouts/ ✅ Implemented
│       │   │   └── dashboard/ ✅ Implemented
│       │   │       ├── app-sidebar.tsx ✅ Implemented
│       │   │       ├── dashboard-layout.tsx ✅ Implemented
│       │   │       └── top-nav.tsx ✅ Implemented
│       │   ├── lib/ ✅ Implemented
│       │   │   ├── api-client.ts ✅ Implemented
│       │   │   └── utils.ts ✅ Implemented
│       │   └── providers/ ✅ Implemented
│       │       └── workspace-provider.tsx ✅ Implemented
│       ├── next.config.mjs ✅ Implemented
│       ├── package.json ✅ Implemented
│       ├── postcss.config.mjs ✅ Implemented
│       ├── tailwind.config.ts ✅ Implemented
│       └── tsconfig.json ✅ Implemented
├── docs/ ✅ Implemented
│   ├── diagram/ ✅ Implemented
│   ├── 01_Project_Overview.md ✅ Implemented
│   ├── 02_System_Architecture.md ✅ Implemented
│   ├── 03_Architecture_Decisions.md ✅ Implemented
│   ├── 04_Database_Design.md ✅ Implemented
│   ├── 05_ER_Diagram.md ✅ Implemented
│   ├── 06_API_Design.md ✅ Implemented
│   ├── 07_Worker_Engine.md ✅ Implemented
│   ├── 08_Queue_Engine.md ✅ Implemented
│   ├── 09_Realtime_Architecture.md ✅ Implemented
│   ├── 10_Testing_Strategy.md ✅ Implemented
│   ├── 11_Deployment.md ✅ Implemented
│   ├── 12_User_Guide.md 📅 Planned
│   ├── 13_Project_Tree.md ✅ Implemented
│   ├── 14_Feature_Checklist.md ✅ Implemented
│   └── 15_Technical_Debt.md ✅ Implemented
├── .env.example ✅ Implemented
├── .gitignore ✅ Implemented
└── README.md ✅ Implemented
```
