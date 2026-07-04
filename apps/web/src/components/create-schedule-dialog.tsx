"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchApi } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import cronstrue from "cronstrue";

interface CreateScheduleDialogProps {
  queueId: string;
  trigger?: React.ReactElement;
}

type ScheduleType = "minutes" | "daily" | "weekly" | "monthly" | "custom";

export function CreateScheduleDialog({ queueId, trigger }: CreateScheduleDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [scheduleType, setScheduleType] = useState<ScheduleType>("minutes");
  const [minuteInterval, setMinuteInterval] = useState("5");
  const [dailyTime, setDailyTime] = useState("00:00");
  const [weeklyDay, setWeeklyDay] = useState("0"); // Sunday
  const [weeklyTime, setWeeklyTime] = useState("00:00");
  const [monthlyDate, setMonthlyDate] = useState("1");
  const [monthlyTime, setMonthlyTime] = useState("00:00");
  const [customCron, setCustomCron] = useState("*/5 * * * *");
  
  const [payloadStr, setPayloadStr] = useState('{"task": "example"}');
  
  const [computedCron, setComputedCron] = useState("*/5 * * * *");
  const [humanCron, setHumanCron] = useState("");

  useEffect(() => {
    let cron = customCron;
    try {
      if (scheduleType === "minutes") {
        cron = `*/${minuteInterval} * * * *`;
      } else if (scheduleType === "daily") {
        const [hours, minutes] = dailyTime.split(":");
        cron = `${parseInt(minutes)} ${parseInt(hours)} * * *`;
      } else if (scheduleType === "weekly") {
        const [hours, minutes] = weeklyTime.split(":");
        cron = `${parseInt(minutes)} ${parseInt(hours)} * * ${weeklyDay}`;
      } else if (scheduleType === "monthly") {
        const [hours, minutes] = monthlyTime.split(":");
        cron = `${parseInt(minutes)} ${parseInt(hours)} ${monthlyDate} * *`;
      }
      setComputedCron(cron);
      setHumanCron(cronstrue.toString(cron));
      setError("");
    } catch (e) {
      setHumanCron("Invalid schedule configuration");
    }
  }, [scheduleType, minuteInterval, dailyTime, weeklyDay, weeklyTime, monthlyDate, monthlyTime, customCron]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let payloadTemplate = null;
      if (payloadStr) {
        try {
          payloadTemplate = JSON.parse(payloadStr);
        } catch (err) {
          throw new Error("Payload must be valid JSON");
        }
      }

      await fetchApi(`/schedules/?queue_id=${queueId}`, {
        method: "POST",
        body: JSON.stringify({
          name,
          cron_expression: computedCron,
          payload_template: payloadTemplate,
          is_active: true
        }),
      });
      
      queryClient.invalidateQueries({ queryKey: ["schedules", queueId] });
      setOpen(false);
      setName("");
      setScheduleType("minutes");
    } catch (err: any) {
      setError(err.message || "Failed to create schedule");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger || <Button>Create Schedule</Button>} />
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Schedule</DialogTitle>
          <DialogDescription>
            Schedule recurring jobs to run automatically.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Schedule Name</Label>
            <Input
              id="name"
              placeholder="e.g., Daily Report Generation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Schedule Frequency</Label>
            <Select value={scheduleType} onValueChange={(v) => v && setScheduleType(v as ScheduleType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">Every X Minutes</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="custom">Custom Cron</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scheduleType === "minutes" && (
            <div className="space-y-2">
              <Label>Interval (Minutes)</Label>
              <Input
                type="number"
                min="1"
                max="59"
                value={minuteInterval}
                onChange={(e) => setMinuteInterval(e.target.value)}
              />
            </div>
          )}

          {scheduleType === "daily" && (
            <div className="space-y-2">
              <Label>Time of Day (UTC)</Label>
              <Input
                type="time"
                value={dailyTime}
                onChange={(e) => setDailyTime(e.target.value)}
              />
            </div>
          )}

          {scheduleType === "weekly" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select value={weeklyDay} onValueChange={(v) => v && setWeeklyDay(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Time (UTC)</Label>
                <Input
                  type="time"
                  value={weeklyTime}
                  onChange={(e) => setWeeklyTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {scheduleType === "monthly" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Day of Month</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={monthlyDate}
                  onChange={(e) => setMonthlyDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Time (UTC)</Label>
                <Input
                  type="time"
                  value={monthlyTime}
                  onChange={(e) => setMonthlyTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {scheduleType === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="cron">Cron Expression</Label>
              <Input
                id="cron"
                placeholder="e.g., 0 0 * * *"
                value={customCron}
                onChange={(e) => setCustomCron(e.target.value)}
                required
              />
            </div>
          )}

          <div className="p-3 bg-muted rounded-md text-sm border border-border">
            <span className="font-semibold text-foreground block mb-1">Summary:</span>
            <span className="text-muted-foreground">{humanCron}</span>
            <div className="text-xs text-muted-foreground/70 mt-1 font-mono">
              Raw: {computedCron}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payload">Payload Template (JSON)</Label>
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
              {loading ? "Creating..." : "Create Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
