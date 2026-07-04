import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock } from "lucide-react";

export function SchedulesWidget({ schedules }: { schedules: any }) {
  if (!schedules) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Schedules</CardTitle>
        <CalendarClock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col mt-2">
          <span className="text-2xl font-bold">{schedules.active}</span>
          <span className="text-xs text-muted-foreground mt-1">Active Schedules</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Triggered Today</span>
            <span className="font-semibold text-sm">{schedules.triggered_today}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Failed</span>
            <span className="font-semibold text-sm text-destructive">{schedules.failed_today}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
