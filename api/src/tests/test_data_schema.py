# empty
from ..config import PORT
import pytest
import json
from pathlib import Path
import yaml

def test_config_and_required_columns():
    cfg = yaml.safe_load(Path("../../configs/train_config.yaml").read_text())
    req = cfg["required_columns"]
    assert isinstance(req, list)
