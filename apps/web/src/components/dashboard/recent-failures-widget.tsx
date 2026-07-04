import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function RecentFailuresWidget({ failures }: { failures: any[] }) {
  if (!failures || failures.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Recent Failures</CardTitle>
        <AlertCircle className="h-4 w-4 text-destructive" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mt-2">
          {failures.map((f) => (
            <div key={f.id} className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{f.name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(f.failed_at).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-xs text-destructive bg-destructive/10 p-2 rounded-md truncate">
                {f.error}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
