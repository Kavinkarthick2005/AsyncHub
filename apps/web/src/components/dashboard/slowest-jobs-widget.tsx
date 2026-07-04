import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Timer } from "lucide-react";

export function SlowestJobsWidget({ jobs }: { jobs: any[] }) {
  if (!jobs || jobs.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Top Slowest Jobs</CardTitle>
        <Timer className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mt-2">
          {jobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{job.name}</span>
                <span className="text-xs text-muted-foreground">{job.queue_name}</span>
              </div>
              <Badge variant="outline" className="font-mono bg-orange-500/10 text-orange-500 border-orange-500/20">
                {(job.duration_ms / 1000).toFixed(1)}s
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
