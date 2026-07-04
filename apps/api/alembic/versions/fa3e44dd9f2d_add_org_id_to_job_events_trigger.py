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
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
