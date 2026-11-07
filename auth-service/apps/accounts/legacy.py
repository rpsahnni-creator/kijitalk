"""
Accounts created before this service existed live only in the Node API's
public.users table, with bcrypt password hashes. They are carried over the
first time the learner signs in here, so nobody has to sign up again.
"""

import logging
import re

import bcrypt
from django.conf import settings
from django.db import DatabaseError, connection, transaction

logger = logging.getLogger(__name__)

_SAFE_TABLE = re.compile(r'^(?:"?[A-Za-z_][A-Za-z0-9_]*"?\.)?"?[A-Za-z_][A-Za-z0-9_]*"?$')


def _table() -> str:
    table = settings.LEGACY_USER_TABLE
    if not _SAFE_TABLE.match(table):
        raise ValueError(f"Unsafe LEGACY_USER_TABLE: {table!r}")
    return table


def find_legacy_account(email: str) -> dict | None:
    """The old profile row for this email, or None (also when the table doesn't exist)."""
    sql = f'SELECT "passwordHash", "displayName", "googleId" FROM {_table()} WHERE lower("email") = %s LIMIT 1'
    try:
        # Savepoint, so a missing table can't poison an outer transaction.
        with transaction.atomic(), connection.cursor() as cursor:
            cursor.execute(sql, [email.lower()])
            row = cursor.fetchone()
    except DatabaseError:
        logger.warning("Legacy user table %s is not readable; skipping legacy lookup", settings.LEGACY_USER_TABLE)
        return None
    if not row:
        return None
    return {"password_hash": row[0], "display_name": row[1] or "Learner", "google_id": row[2]}


def legacy_password_matches(password: str, password_hash: str | None) -> bool:
    if not password_hash or not password_hash.startswith(("$2a$", "$2b$", "$2y$")):
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False
