FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    POETRY_VERSION=1.8.3 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_NO_INTERACTION=1

RUN pip install --no-cache-dir "poetry==${POETRY_VERSION}"

WORKDIR /app

COPY pyproject.toml ./
RUN poetry install --no-root

COPY app ./app

ENV DATABASE_PATH=/data/app.db \
    SECRET_KEY=dev-secret-key-change-in-production \
    BASE_URL=http://localhost:8000 \
    IMAGES_DIR=/data/images \
    ALLOWED_ORIGINS=http://localhost:3000

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
