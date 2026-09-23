from typing import Dict, List
from fastapi import WebSocket
import json


class ConnectionManager:
    """
    Manages WebSocket connections.
    - Drivers connect and send GPS updates.
    - Parents/Admin subscribe to a specific bus_id to receive updates.
    """

    def __init__(self):
        # bus_id -> list of subscriber WebSockets (parents, admin)
        self.bus_subscribers: Dict[int, List[WebSocket]] = {}
        # user_id -> WebSocket (drivers)
        self.driver_connections: Dict[int, WebSocket] = {}

    async def connect_driver(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.driver_connections[user_id] = websocket

    def disconnect_driver(self, user_id: int):
        self.driver_connections.pop(user_id, None)

    async def connect_subscriber(self, websocket: WebSocket, bus_id: int):
        await websocket.accept()
        if bus_id not in self.bus_subscribers:
            self.bus_subscribers[bus_id] = []
        self.bus_subscribers[bus_id].append(websocket)

    def disconnect_subscriber(self, websocket: WebSocket, bus_id: int):
        if bus_id in self.bus_subscribers:
            self.bus_subscribers[bus_id] = [
                ws for ws in self.bus_subscribers[bus_id] if ws != websocket
            ]

    async def broadcast_to_bus_subscribers(self, bus_id: int, data: dict):
        """Send a message to all clients subscribed to a particular bus."""
        subscribers = self.bus_subscribers.get(bus_id, [])
        dead = []
        for ws in subscribers:
            try:
                await ws.send_text(json.dumps(data))
            except Exception:
                dead.append(ws)
        # Clean up dead connections
        for ws in dead:
            self.disconnect_subscriber(ws, bus_id)

    async def send_to_user(self, user_websocket: WebSocket, data: dict):
        try:
            await user_websocket.send_text(json.dumps(data))
        except Exception:
            pass


manager = ConnectionManager()
