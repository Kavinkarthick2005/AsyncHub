import {
  LayoutDashboard,
  Building2,
  FolderOpen,
  ListOrdered,
  Activity,
  Server,
  CalendarClock,
  GitMerge,
  BarChart,
  MailWarning,
  ShieldCheck,
  Settings,
} from "lucide-react";

export const DASHBOARD_NAV_ITEMS = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Organizations",
    url: "/organizations",
    icon: Building2,
  },
  {
    title: "Projects",
    url: "/projects",
    icon: FolderOpen,
  },
];

export const ORCHESTRATION_NAV_ITEMS = [
  {
    title: "Queues",
    url: "/queues",
    icon: ListOrdered,
  },
  {
    title: "Jobs",
    url: "/jobs",
    icon: Activity,
  },
  {
    title: "Workers",
    url: "/workers",
    icon: Server,
  },
  {
    title: "Schedules",
    url: "/schedules",
    icon: CalendarClock,
  },
  {
    title: "Workflows",
    url: "/workflows",
    icon: GitMerge,
  },
];

export const SYSTEM_NAV_ITEMS = [
  {
    title: "Dead Letters",
    url: "/dlq",
    icon: MailWarning,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];
