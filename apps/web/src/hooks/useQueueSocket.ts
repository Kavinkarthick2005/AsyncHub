"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface UseQueueSocketOptions {
  queueId: string;
  token: string | null;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export function useQueueSocket({ queueId, token, onConnected, onDisconnected }: UseQueueSocketOptions) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  useEffect(() => {
    if (!token || !queueId) return;

    let isComponentMounted = true;
    let pingInterval: NodeJS.Timeout | null = null;

    const connect = () => {
      // Exponential backoff capped at 30 seconds
      const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttempt), 30000);
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const wsProtocol = baseUrl.startsWith("https") ? "wss" : "ws";
      const wsBase = baseUrl.replace(/^https?/, wsProtocol).replace(/\/$/, "");
      const wsUrl = `${wsBase}/api/v1/ws/queues/${queueId}?token=${token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isComponentMounted) return;
        setReconnectAttempt(0);
        onConnected?.();
        
        // Start ping interval
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "job.status_changed") {
            const { job_id, to_status } = data.payload;
            
            // Realtime Cache Synchronization
            queryClient.setQueryData(
              ["jobs", queueId],
              (oldData: any) => {
                if (!oldData || !oldData.items) return oldData;
                
                return {
                  ...oldData,
                  items: oldData.items.map((job: any) => 
                    job.id === job_id ? { ...job, status: to_status } : job
                  )
                };
              }
            );
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onclose = () => {
        if (!isComponentMounted) return;
        onDisconnected?.();
        
        if (pingInterval) clearInterval(pingInterval);
        
        // Attempt reconnect
        setReconnectAttempt((prev) => prev + 1);
        reconnectTimeoutRef.current = setTimeout(connect, backoffDelay);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
    };

    connect();

    return () => {
      isComponentMounted = false;
      if (pingInterval) clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [queueId, token, reconnectAttempt, queryClient, onConnected, onDisconnected]);

  return { ws: wsRef.current };
}
