import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock } from "lucide-react";

export function QueuesWidget({ queues }: { queues: any[] }) {
  if (!queues) return null;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b">
        <CardTitle className="text-sm font-medium">Queues</CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Queue</TableHead>
              <TableHead className="text-right">Depth</TableHead>
              <TableHead className="text-right">Throughput (1h)</TableHead>
              <TableHead className="text-right">Avg Latency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                  No queues found.
                </TableCell>
              </TableRow>
            ) : (
              queues.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <span>{q.name}</span>
                      {q.is_paused && <Badge variant="destructive" className="text-[10px] h-4 px-1 py-0">Paused</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">{q.depth}</TableCell>
                  <TableCell className="text-right font-mono">{q.throughput_1h}/hr</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    {q.avg_latency_ms > 0 ? `${(q.avg_latency_ms / 1000).toFixed(2)}s` : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
