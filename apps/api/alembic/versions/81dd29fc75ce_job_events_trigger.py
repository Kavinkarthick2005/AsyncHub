"""job_events_trigger

Revision ID: 81dd29fc75ce
Revises: 3539d364a3fe
Create Date: 2026-07-04 12:06:50.145210

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '81dd29fc75ce'
down_revision: Union[str, Sequence[str], None] = '3539d364a3fe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create the trigger function
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
    
    # 2. Create the trigger
    op.execute("""
    CREATE TRIGGER trg_job_events_insert
    AFTER INSERT ON job_events
    FOR EACH ROW
    EXECUTE FUNCTION notify_job_event();
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_job_events_insert ON job_events;")
    op.execute("DROP FUNCTION IF EXISTS notify_job_event();")
