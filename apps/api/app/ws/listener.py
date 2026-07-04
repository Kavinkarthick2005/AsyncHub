import asyncio
import json
import logging
import asyncpg
from app.core.config import settings
from app.ws.manager import manager

logger = logging.getLogger(__name__)

async def _listen_loop():
    # Remove the `+asyncpg` from DATABASE_URL if present because asyncpg doesn't like it.
    dsn = settings.DATABASE_URL.replace("+asyncpg", "")
    
    while True:
        try:
            conn = await asyncpg.connect(dsn)
            
            def handle_notification(connection, pid, channel, payload):
                logger.info(f"Received notification on {channel}: {payload}")
                try:
                    data = json.loads(payload)
                    payload_data = data.get("payload", {})
                    queue_id = payload_data.get("queue_id")
                    org_id = payload_data.get("org_id")
                    
                    if queue_id:
                        asyncio.create_task(manager.broadcast("queue", queue_id, data))
                        
                    if org_id:
                        asyncio.create_task(manager.broadcast("org", org_id, data))
                except Exception as e:
                    logger.error(f"Error handling notification: {e}")

            await conn.add_listener('job_events_channel', handle_notification)
            logger.info("Successfully connected to Postgres LISTEN channel 'job_events_channel'")
            
            # Keep the connection alive indefinitely
            while True:
                await asyncio.sleep(3600)
                
        except asyncio.CancelledError:
            logger.info("Listener loop cancelled.")
            break
        except Exception as e:
            logger.error(f"Listener connection failed: {e}. Retrying in 5s...")
            await asyncio.sleep(5)

# We will start this task in main.py lifespan
listener_task = None

def start_listener():
    global listener_task
    listener_task = asyncio.create_task(_listen_loop())

async def stop_listener():
    global listener_task
    if listener_task:
        listener_task.cancel()
        try:
            await listener_task
        except asyncio.CancelledError:
            pass
