"""
Import every model module here so that Base.metadata.create_all() (used in
main.py on startup, for dev/first-run convenience) and any future Alembic
autogenerate can discover all tables. A model defined but not imported
somewhere reachable from here will silently be missing from the schema.
"""
from app.models.advisor import Advisor
from app.models.snapshot import AdvisorMetricSnapshot
from app.models.upload import ImportBatch

__all__ = ["Advisor", "AdvisorMetricSnapshot", "ImportBatch"]
