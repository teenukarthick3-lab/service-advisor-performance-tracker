"""
Excel upload API.

Endpoints:

POST /api/upload/preview
    Parse and validate an Excel workbook.
    Does NOT modify the database.

POST /api/upload/commit
    Parse, validate and permanently import an Excel workbook.
    Uses a database transaction.
"""

from __future__ import annotations

from datetime import date
from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
)
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.excel_ingestion import parse_workbook
from app.services.import_service import import_workbook_result


router = APIRouter(
    prefix="/api/upload",
    tags=["Upload"],
)


# ============================================================================
# Helpers
# ============================================================================

ALLOWED_EXTENSIONS = {
    ".xlsx",
    ".xlsm",
}


def validate_filename(filename: str | None) -> str:
    """
    Validate the uploaded Excel filename.
    """

    if not filename:
        raise HTTPException(
            status_code=400,
            detail="No file name was provided.",
        )

    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only .xlsx or .xlsm Excel files are supported.",
        )

    return extension


async def save_upload_to_temp_file(
    file: UploadFile,
    extension: str,
) -> str:
    """
    Save the uploaded file to a temporary location.

    The caller is responsible for deleting the temporary file.
    """

    temporary_path: str | None = None

    try:
        with NamedTemporaryFile(
            suffix=extension,
            delete=False,
        ) as temporary_file:

            temporary_path = temporary_file.name

            while True:
                chunk = await file.read(1024 * 1024)

                if not chunk:
                    break

                temporary_file.write(chunk)

        return temporary_path

    except Exception:
        if temporary_path:
            Path(temporary_path).unlink(
                missing_ok=True,
            )

        raise


def build_issues(
    result,
    severity: str,
) -> list[dict]:
    """
    Convert ValidationIssue objects into JSON-safe dictionaries.
    """

    return [
        {
            "message": issue.message,
            "sheet": issue.sheet,
            "row": issue.row,
        }
        for issue in result.issues
        if issue.severity == severity
    ]


# ============================================================================
# Preview
# ============================================================================


@router.post("/preview")
async def preview_upload(
    file: UploadFile = File(...),
):
    """
    Parse and validate an uploaded Excel workbook.

    IMPORTANT:
    This endpoint NEVER writes anything to the database.
    """

    extension = validate_filename(file.filename)

    temporary_path: str | None = None

    try:
        # ---------------------------------------------------------
        # Save upload temporarily
        # ---------------------------------------------------------

        temporary_path = await save_upload_to_temp_file(
            file,
            extension,
        )

        # ---------------------------------------------------------
        # Parse workbook
        # ---------------------------------------------------------

        result = parse_workbook(
            temporary_path,
            year=2026,
        )
        print()
        print("========== COMMIT PARSER DEBUG ==========")
        print("UPLOADED TEMP FILE:", temporary_path)
        print("ROWS PARSED:", result.rows_parsed)

        ambika = next(
            (
                snapshot
                for snapshot in result.snapshots
                if snapshot.display_name.strip().lower() == "ambika m"
            ),
            None,
        )

        if ambika is None:
            print("AMBIKA: NOT FOUND")
        else:
            print("AMBIKA METRICS FROM BROWSER UPLOAD:")
            print(ambika.metrics)

        print("==========================================")
        print()

        # ---------------------------------------------------------
        # Validation results
        # ---------------------------------------------------------

        errors = build_issues(
            result,
            "error",
        )

        warnings = build_issues(
            result,
            "warning",
        )

        # ---------------------------------------------------------
        # Status
        # ---------------------------------------------------------

        status = (
            "ready"
            if not errors
            else "rejected"
        )

        # ---------------------------------------------------------
        # Months
        # ---------------------------------------------------------

        months = sorted(
            {
                snapshot.month
                for snapshot in result.snapshots
            }
        )

        # ---------------------------------------------------------
        # Unique advisors
        # ---------------------------------------------------------

        advisors = {
            snapshot.identity_key
            for snapshot in result.snapshots
        }

        # ---------------------------------------------------------
        # Response
        # ---------------------------------------------------------

        return {
            "status": status,
            "filename": file.filename,
            "rows_parsed": result.rows_parsed,
            "advisor_count": len(advisors),
            "months": months,
            "errors": errors,
            "warnings": warnings,
            "error_count": len(errors),
            "warning_count": len(warnings),
            "database_modified": False,
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to process Excel file: {exc}",
        ) from exc

    finally:
        # ---------------------------------------------------------
        # Delete temporary file
        # ---------------------------------------------------------

        if temporary_path:
            Path(temporary_path).unlink(
                missing_ok=True,
            )

        await file.close()


# ============================================================================
# Commit
# ============================================================================


@router.post("/commit")
async def commit_upload(
    file: UploadFile = File(...),
    business_date: date = Form(...),
    db: Session = Depends(get_db),
):
    """
    Parse, validate and permanently import an Excel workbook.

    Database behavior:

        Valid workbook
            ↓
        ImportBatch created
            ↓
        Advisors upserted
            ↓
        Snapshots upserted
            ↓
        Transaction committed

    If anything fails:

        Transaction rolled back
        Existing committed data remains unchanged.
    """

    extension = validate_filename(file.filename)

    temporary_path: str | None = None

    try:
        # ---------------------------------------------------------
        # Save upload temporarily
        # ---------------------------------------------------------

        temporary_path = await save_upload_to_temp_file(
            file,
            extension,
        )

        # ---------------------------------------------------------
        # Parse and validate again
        #
        # The commit endpoint must NEVER trust a previous preview
        # request because preview and commit are separate requests.
        # ---------------------------------------------------------

        result = parse_workbook(
            temporary_path,
            year=2026,
        )

        # ---------------------------------------------------------
        # Validation errors
        # ---------------------------------------------------------

        errors = build_issues(
            result,
            "error",
        )

        # ---------------------------------------------------------
        # Reject invalid workbook
        #
        # No database operation has happened yet.
        # ---------------------------------------------------------

        if errors:
            return {
                "status": "rejected",
                "filename": file.filename,
                "business_date": business_date.isoformat(),
                "rows_parsed": result.rows_parsed,
                "rows_inserted": 0,
                "rows_updated": 0,
                "rows_failed": 0,
                "rows_rejected": len(errors),
                "errors": errors,
                "database_modified": False,
            }

        # ---------------------------------------------------------
        # Import into database
        # ---------------------------------------------------------

        summary = import_workbook_result(
            db=db,
            result=result,
            filename=file.filename,
            business_date=business_date,
        )

        # ---------------------------------------------------------
        # COMMIT
        #
        # Nothing becomes permanent until this succeeds.
        # ---------------------------------------------------------

        db.commit()

        return {
            **summary,
            "database_modified": True,
        }

    except HTTPException:
        # ---------------------------------------------------------
        # Rollback pending transaction
        # ---------------------------------------------------------

        db.rollback()
        raise

    except Exception as exc:
        # ---------------------------------------------------------
        # IMPORTANT:
        # Never leave a partially imported transaction.
        # ---------------------------------------------------------

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Import failed. "
                "No database changes were committed. "
                f"Reason: {exc}"
            ),
        ) from exc

    finally:
        # ---------------------------------------------------------
        # Delete temporary file
        # ---------------------------------------------------------

        if temporary_path:
            Path(temporary_path).unlink(
                missing_ok=True,
            )

        await file.close()