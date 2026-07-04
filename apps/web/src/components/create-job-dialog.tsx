"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchApi } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock } from "lucide-react";

interface CreateJobDialogProps {
  queueId: string;
  trigger?: React.ReactElement;
}

export function CreateJobDialog({ queueId, trigger }: CreateJobDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [payloadStr, setPayloadStr] = useState('{"task": "example"}');
  
  const [scheduleMode, setScheduleMode] = useState("now");
  const [customDate, setCustomDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let payload = null;
      if (payloadStr) {
        try {
          payload = JSON.parse(payloadStr);
        } catch (err) {
          throw new Error("Payload must be valid JSON");
        }
      }

      let runAfter = null;
      const now = new Date();
      
      if (scheduleMode === "5m") {
        runAfter = new Date(now.getTime() + 5 * 60000);
      } else if (scheduleMode === "30m") {
        runAfter = new Date(now.getTime() + 30 * 60000);
      } else if (scheduleMode === "tomorrow") {
        runAfter = new Date(now.getTime() + 24 * 60 * 60000);
      } else if (scheduleMode === "custom" && customDate) {
        runAfter = new Date(customDate);
      }

      await fetchApi(`/queues/${queueId}/jobs`, {
        method: "POST",
        body: JSON.stringify({
          name,
          payload,
          run_after: runAfter ? runAfter.toISOString() : null,
        }),
      });
      
      queryClient.invalidateQueries({ queryKey: ["jobs", queueId] });
      setOpen(false);
      setName("");
      setScheduleMode("now");
    } catch (err: any) {
      setError(err.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger || <Button>Create Job</Button>} />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enqueue Job</DialogTitle>
          <DialogDescription>
            Submit a single job to the queue. You can run it immediately or delay its execution.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Job Name</Label>
            <Input
              id="name"
              placeholder="e.g., Export Data"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Execution Time</Label>
            <Select value={scheduleMode} onValueChange={(v) => v && setScheduleMode(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Run Now" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="now">Run Now</SelectItem>
                <SelectItem value="5m">In 5 Minutes</SelectItem>
                <SelectItem value="30m">In 30 Minutes</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="custom">Custom Date & Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scheduleMode === "custom" && (
            <div className="space-y-2">
              <Label>Custom Schedule (Local Time)</Label>
              <Input
                type="datetime-local"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="payload">Payload (JSON)</Label>
            <Input
              id="payload"
              placeholder='{"key": "value"}'
              value={payloadStr}
              onChange={(e) => setPayloadStr(e.target.value)}
            />
          </div>
          
          {error && <div className="text-sm text-destructive">{error}</div>}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enqueuing..." : "Enqueue Job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
