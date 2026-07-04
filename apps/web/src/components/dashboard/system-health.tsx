import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

export function SystemHealthWidget({ health }: { health: any }) {
  if (!health) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">System Health</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {Object.entries(health).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm capitalize text-muted-foreground">{key}</span>
              <Badge variant={value === "Healthy" ? "default" : "destructive"} className="text-[10px] px-1 py-0 h-4">
                {value as string}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
