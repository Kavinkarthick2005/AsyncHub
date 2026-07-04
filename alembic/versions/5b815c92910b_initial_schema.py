"""initial_schema

Revision ID: 5b815c92910b
Revises: 
Create Date: 2026-07-04 10:16:38.726394

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '5b815c92910b'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create ENUMs
    role_enum = postgresql.ENUM('owner', 'admin', 'developer', 'viewer', name='role_enum')
    role_enum.create(op.get_bind())

    job_status_enum = postgresql.ENUM('queued', 'running', 'completed', 'failed', 'dead', name='job_status_enum')
    job_status_enum.create(op.get_bind())

    worker_status_enum = postgresql.ENUM('online', 'offline', name='worker_status_enum')
    worker_status_enum.create(op.get_bind())

    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )

    op.create_table(
        'organizations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('slug', sa.String(), nullable=False, unique=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )

    op.create_table(
        'memberships',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('role', postgresql.ENUM(name='role_enum', create_type=False), nullable=False)
    )

    op.create_table(
        'projects',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('org_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('organizations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )

    op.create_table(
        'queues',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('concurrency_limit', sa.Integer(), nullable=True),
        sa.Column('priority', sa.Integer(), nullable=False, default=0),
        sa.Column('is_paused', sa.Boolean(), nullable=False, default=False)
    )

    op.create_table(
        'jobs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('queue_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('queues.id', ondelete='CASCADE'), nullable=False),
        sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('status', postgresql.ENUM(name='job_status_enum', create_type=False), nullable=False, default='queued'),
        sa.Column('priority', sa.Integer(), nullable=False, default=0),
        sa.Column('retries', sa.Integer(), nullable=False, default=0),
        sa.Column('max_retries', sa.Integer(), nullable=False, default=3),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint('retries <= max_retries', name='check_retries_le_max_retries')
    )

    op.create_index('ix_jobs_status_queue_id', 'jobs', ['status', 'queue_id'])
    op.create_index('ix_jobs_created_at', 'jobs', ['created_at'])

    op.create_table(
        'job_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('job_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('jobs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('from_status', postgresql.ENUM(name='job_status_enum', create_type=False), nullable=True),
        sa.Column('to_status', postgresql.ENUM(name='job_status_enum', create_type=False), nullable=False),
        sa.Column('message', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False)
    )

    op.create_table(
        'workers',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('last_heartbeat', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('status', postgresql.ENUM(name='worker_status_enum', create_type=False), nullable=False, default='online'),
        sa.Column('current_job_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('jobs.id', ondelete='SET NULL'), nullable=True)
    )


def downgrade() -> None:
    op.drop_table('workers')
    op.drop_table('job_events')
    op.drop_index('ix_jobs_created_at', table_name='jobs')
    op.drop_index('ix_jobs_status_queue_id', table_name='jobs')
    op.drop_table('jobs')
    op.drop_table('queues')
    op.drop_table('projects')
    op.drop_table('memberships')
    op.drop_table('organizations')
    op.drop_table('users')

    postgresql.ENUM(name='worker_status_enum').drop(op.get_bind())
    postgresql.ENUM(name='job_status_enum').drop(op.get_bind())
    postgresql.ENUM(name='role_enum').drop(op.get_bind())
