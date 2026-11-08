# KijiTalk auth service (Django + DRF + SimpleJWT)
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt gunicorn==23.0.0
COPY . .
RUN useradd --system app && chown -R app /app
USER app
EXPOSE 8100
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8100/health/')" || exit 1
# Create the schema (no-op if present), migrate, then serve with gunicorn.
CMD ["sh", "-c", "python manage.py ensure_auth_schema && python manage.py migrate --noinput && gunicorn config.wsgi:application --bind 0.0.0.0:8100 --workers 3 --access-logfile -"]
