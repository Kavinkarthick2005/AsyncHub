"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Server, Clock, AlertCircle } from "lucide-react";

export function RealtimeFeedWidget({ organizationId }: { organizationId: string }) {
  const [events, setEvents] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!organizationId) return;

    const token = localStorage.getItem("asynchub_token");
    if (!token) return;

    // Use WS endpoint
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = process.env.NEXT_PUBLIC_API_URL?.replace("http://", "")?.replace("https://", "") || "localhost:8000";
    const wsUrl = `${protocol}//${host}/api/v1/ws/orgs/${organizationId}?token=${token}`;

    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "connection.established") return;
      if (data.type === "pong") return;

      setEvents((prev) => [data, ...prev].slice(0, 50)); // keep last 50 events
    };

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      ws.close();
    };
  }, [organizationId]);

  const filteredEvents = events.filter((e) => {
    if (filter === "all") return true;
    if (filter === "jobs") return e.type.startsWith("job.");
    if (filter === "workers") return e.type.startsWith("worker.");
    if (filter === "queues") return e.type.startsWith("queue.");
    if (filter === "schedules") return e.type.startsWith("schedule.");
    return true;
  });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b">
        <CardTitle className="text-sm font-medium">Realtime Event Feed</CardTitle>
        <div className="flex space-x-1">
          {["all", "jobs", "workers", "queues", "schedules"].map((f) => (
            <Badge
              key={f}
              variant={filter === f ? "default" : "outline"}
              className="cursor-pointer capitalize text-[10px] px-1"
              onClick={() => setFilter(f)}
            >
              {f}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0 min-h-[300px] max-h-[500px]">
        {filteredEvents.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            Waiting for events...
          </div>
        ) : (
          <div className="divide-y">
            {filteredEvents.map((evt, i) => (
              <div key={i} className="p-3 text-sm flex items-start space-x-3">
                <div className="mt-0.5">
                  {evt.type.startsWith("job.") ? (
                    <Activity className="h-4 w-4 text-blue-500" />
                  ) : evt.type.startsWith("worker.") ? (
                    <Server className="h-4 w-4 text-emerald-500" />
                  ) : evt.type.startsWith("queue.") ? (
                    <Clock className="h-4 w-4 text-purple-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{evt.type}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs break-all mt-1">
                    {JSON.stringify(evt.payload)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
