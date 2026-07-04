import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function WorkersWidget({ workers }: { workers: any }) {
  if (!workers) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Workers</CardTitle>
        <Server className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mt-2">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            {workers.online} Online
          </Badge>
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            {workers.offline} Offline
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Avg CPU</span>
            <span className="font-semibold text-sm">{workers.avg_cpu}%</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Avg Mem</span>
            <span className="font-semibold text-sm">{workers.avg_memory} MB</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
