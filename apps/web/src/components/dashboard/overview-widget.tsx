import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers } from "lucide-react";

export function OverviewWidget({ overview }: { overview: any }) {
  if (!overview) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Jobs Overview</CardTitle>
        <Layers className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Active</span>
            <span className="font-bold text-lg">{overview.active_jobs}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Queued</span>
            <span className="font-bold text-lg">{overview.queued_jobs}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Running</span>
            <span className="font-bold text-lg">{overview.running_jobs}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Failed</span>
            <span className="font-bold text-lg text-destructive">{overview.failed_jobs}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
