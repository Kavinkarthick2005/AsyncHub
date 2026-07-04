from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class SystemHealth(BaseModel):
    api: str
    database: str
    workers: str
    scheduler: str

class JobLatency(BaseModel):
    id: UUID
    name: str
    duration_ms: float
    queue_name: str

class RetryHeatmapItem(BaseModel):
    queue_name: str
    retry_count: int

class RecentFailureItem(BaseModel):
    id: UUID
    name: str
    error: str
    failed_at: Optional[datetime]

class OverviewMetrics(BaseModel):
    active_jobs: int
    queued_jobs: int
    running_jobs: int
    failed_jobs: int
    completed_today: int

class WorkerMetrics(BaseModel):
    online: int
    offline: int
    avg_cpu: float
    avg_memory: float

class QueueMetric(BaseModel):
    id: UUID
    name: str
    depth: int
    is_paused: bool
    throughput_1h: int
    avg_latency_ms: float

class ScheduleMetrics(BaseModel):
    active: int
    triggered_today: int
    failed_today: int

class DashboardResponse(BaseModel):
    system_health: SystemHealth
    overview: OverviewMetrics
    workers: WorkerMetrics
    schedules: ScheduleMetrics
    queues: List[QueueMetric]
    slowest_jobs: List[JobLatency]
    retry_heatmap: List[RetryHeatmapItem]
    recent_failures: List[RecentFailureItem]

    model_config = ConfigDict(from_attributes=True)
