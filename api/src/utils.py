import logging
import yaml
from pathlib import Path

def get_logger(name="remapi"):
    cfg_path = Path(__file__).resolve().parents[1] / "configs" / "train_config.yaml"
    try:
        cfg = yaml.safe_load(open(cfg_path))
        level = cfg.get("logging", {}).get("level", "INFO")
    except Exception:
        level = "INFO"
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        fmt = logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s")
        handler.setFormatter(fmt)
        logger.addHandler(handler)
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    return logger

logger = get_logger()
