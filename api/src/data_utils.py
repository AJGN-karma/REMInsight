import json
from pathlib import Path

def load_json_safe(path):
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return {}

def save_json_safe(path, data):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    with open(p, "w") as f:
        json.dump(data, f, indent=2)
