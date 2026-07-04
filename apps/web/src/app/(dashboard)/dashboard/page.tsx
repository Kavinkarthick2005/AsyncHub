"use client";

import { Activity, Server, Clock, AlertCircle, ArrowUpRight, ArrowDownRight, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useFadeIn, useStaggerFadeIn } from "@/animations";

const data = [
  { time: "00:00", jobs: 120, cpu: 45 },
  { time: "04:00", jobs: 180, cpu: 55 },
  { time: "08:00", jobs: 450, cpu: 85 },
  { time: "12:00", jobs: 400, cpu: 75 },
  { time: "16:00", jobs: 350, cpu: 65 },
  { time: "20:00", jobs: 200, cpu: 50 },
  { time: "24:00", jobs: 150, cpu: 40 },
];

const recentActivity = [
  { id: "job_948", type: "workflow.completed", status: "success", time: "2 mins ago", worker: "node-us-east-1a" },
  { id: "job_947", type: "image.process", status: "failed", time: "5 mins ago", worker: "node-us-east-1b" },
  { id: "job_946", type: "report.generate", status: "success", time: "12 mins ago", worker: "node-us-east-1a" },
  { id: "job_945", type: "email.send_batch", status: "success", time: "18 mins ago", worker: "node-us-west-1a" },
];

export default function DashboardPage() {
  const containerRef = useStaggerFadeIn(0.1, 0, 0.5);

  return (
    <div className="flex flex-col gap-6" ref={containerRef}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-2">Monitor your orchestration cluster in real-time.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <span className="text-primary flex items-center"><ArrowUpRight className="mr-1 h-3 w-3" /> +2</span>
              <span className="ml-2">from last hour</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Jobs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,204</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <span className="text-primary flex items-center"><ArrowUpRight className="mr-1 h-3 w-3" /> +18%</span>
              <span className="ml-2">from last hour</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.98%</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <span className="text-destructive flex items-center"><ArrowDownRight className="mr-1 h-3 w-3" /> -0.01%</span>
              <span className="ml-2">from last hour</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dead Letters</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              Requires manual intervention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Job Throughput</CardTitle>
            <CardDescription>
              Jobs processed per minute over the last 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Area type="monotone" dataKey="jobs" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorJobs)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-3 flex flex-col">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Live feed of state transitions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-6">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center">
                  <Avatar className="h-9 w-9 ring-1 ring-border">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {activity.type.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.id} - {activity.type}</p>
                    <p className="text-sm text-muted-foreground">
                      Processed by {activity.worker}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-4">
                    <Badge variant={activity.status === "success" ? "default" : "destructive"}>
                      {activity.status}
                    </Badge>
                    <div className="text-xs text-muted-foreground w-16 text-right">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
