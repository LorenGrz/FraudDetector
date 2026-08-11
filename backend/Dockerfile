FROM public.ecr.aws/lambda/python:3.11

WORKDIR ${LAMBDA_TASK_ROOT}

# Install deps first for better layer caching
COPY backend/requerimientos.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --prefer-binary \
        fastapi uvicorn sqlalchemy pandas scikit-learn plotly mangum aiofiles

# Copy backend source
COPY backend/ .

# Build SQLite DB: create tables first, then load CSV data
RUN python -c "from database import engine, Base; import models; Base.metadata.create_all(bind=engine)"
RUN python cargar_csvs.py

# Copy frontend for static file serving
COPY frontend/ frontend/

CMD ["handler.handler"]
