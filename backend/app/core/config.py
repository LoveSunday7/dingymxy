"""配置加载模块"""
import os
from typing import Any

import yaml
from pathlib import Path


# 项目根目录（backend/）
BASE_DIR = Path(__file__).resolve().parent.parent.parent


def load_config() -> dict[str, Any]:
    """加载配置文件，环境变量可覆盖"""
    config_path = os.environ.get("CONFIG_PATH", str(BASE_DIR / "config.yaml"))
    with open(config_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    # 环境变量覆盖
    if env_secret := os.environ.get("SECRET_KEY"):
        config["auth"]["secret_key"] = env_secret
    if env_db := os.environ.get("DB_PATH"):
        config["database"]["path"] = env_db
    if env_port := os.environ.get("SERVER_PORT"):
        config["server"]["port"] = int(env_port)

    return config


config = load_config()


def get_config() -> dict[str, Any]:
    return config
