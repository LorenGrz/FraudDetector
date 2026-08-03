import os
import shutil
from pathlib import Path

# Lambda code directory is read-only; SQLite needs a writable path.
_src = Path(os.environ.get("LAMBDA_TASK_ROOT", ".")) / "transacciones.db"
_dst = Path("/tmp/transacciones.db")
if not _dst.exists() and _src.exists():
    shutil.copy2(str(_src), str(_dst))

os.environ.setdefault("DATABASE_URL", "sqlite:////tmp/transacciones.db")

from mangum import Mangum  # noqa: E402
from main import app  # noqa: E402

handler = Mangum(app, lifespan="off")
