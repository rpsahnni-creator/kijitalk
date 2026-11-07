import re

import psycopg
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Create the Postgres schema that holds this service's tables (run once, before migrate)."

    def handle(self, *args, **options):
        schema = settings.AUTH_DB_SCHEMA
        if not re.fullmatch(r"[a-z_][a-z0-9_]*", schema):
            raise CommandError(f"Unsafe AUTH_DB_SCHEMA: {schema!r}")

        db = settings.DATABASES["default"]
        conninfo = {
            "dbname": db["NAME"],
            "user": db["USER"],
            "password": db["PASSWORD"],
            "host": db["HOST"],
            "port": db["PORT"],
        }
        # A plain connection: Django's own one is pinned to the schema that may not exist yet.
        with psycopg.connect(**conninfo, autocommit=True) as conn:
            conn.execute(f'CREATE SCHEMA IF NOT EXISTS "{schema}"')
        self.stdout.write(self.style.SUCCESS(f'Schema "{schema}" is ready.'))
