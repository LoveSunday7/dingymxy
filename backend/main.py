"""后端启动入口"""
import uvicorn
from app.main import create_app
from app.core.config import get_config

app = create_app()

if __name__ == "__main__":
    cfg = get_config()
    server_cfg = cfg["server"]
    uvicorn.run(
        "main:app",
        host=server_cfg["host"],
        port=server_cfg["port"],
        reload=server_cfg.get("debug", False),
    )
