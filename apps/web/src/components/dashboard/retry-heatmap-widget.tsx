import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";

export function RetryHeatmapWidget({ heatmap }: { heatmap: any[] }) {
  if (!heatmap || heatmap.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Retry Heatmap</CardTitle>
        <Flame className="h-4 w-4 text-orange-500" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mt-2">
          {heatmap.map((item, i) => {
            // Determine a visual color based on relative retry count (mocked max here for simplicity)
            const max = Math.max(...heatmap.map(h => h.retry_count));
            const pct = Math.min(100, Math.max(10, (item.retry_count / max) * 100));
            return (
              <div key={i} className="flex flex-col space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground">{item.queue_name}</span>
                  <span className="font-bold">{item.retry_count} retries</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 rounded-full" 
                    style={{ width: `${pct}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
