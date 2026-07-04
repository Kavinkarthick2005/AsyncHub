"""add_org_id_to_job_events_trigger

Revision ID: fa3e44dd9f2d
Revises: 940aaf164d29
Create Date: 2026-07-04 19:16:53.268568

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fa3e44dd9f2d'
down_revision: Union[str, Sequence[str], None] = '940aaf164d29'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Update the trigger function to include org_id in the payload
    op.execute("""
    CREATE OR REPLACE FUNCTION notify_job_event()
    RETURNS trigger AS $$
    DECLARE
        v_queue_id UUID;
        v_org_id UUID;
        payload JSON;
    BEGIN
        -- Lookup queue_id and org_id
        SELECT j.queue_id, p.org_id 
        INTO v_queue_id, v_org_id 
        FROM jobs j
        JOIN queues q ON j.queue_id = q.id
        JOIN projects p ON q.project_id = p.id
        WHERE j.id = NEW.job_id;
        
        -- Build the versioned envelope payload
        payload := json_build_object(
            'type', 'job.status_changed',
            'payload', json_build_object(
                'job_id', NEW.job_id,
                'queue_id', v_queue_id,
                'org_id', v_org_id,
                'from_status', NEW.from_status,
                'to_status', NEW.to_status,
                'timestamp', NEW.created_at
            )
        );
        
        -- Broadcast on job_events_channel
        PERFORM pg_notify('job_events_channel', payload::text);
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)

def downgrade() -> None:
    # Revert to the old trigger function
    op.execute("""
    CREATE OR REPLACE FUNCTION notify_job_event()
    RETURNS trigger AS $$
    DECLARE
        v_queue_id UUID;
        payload JSON;
    BEGIN
        -- Lookup queue_id from jobs table
        SELECT queue_id INTO v_queue_id FROM jobs WHERE id = NEW.job_id;
        
        -- Build the versioned envelope payload
        payload := json_build_object(
            'type', 'job.status_changed',
            'payload', json_build_object(
                'job_id', NEW.job_id,
                'queue_id', v_queue_id,
                'from_status', NEW.from_status,
                'to_status', NEW.to_status,
                'timestamp', NEW.created_at
            )
        );
        
        -- Broadcast on job_events_channel
        PERFORM pg_notify('job_events_channel', payload::text);
        
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    """)
