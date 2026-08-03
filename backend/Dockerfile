FROM public.ecr.aws/lambda/python:3.11

WORKDIR ${LAMBDA_TASK_ROOT}

# Install deps first for better layer caching
COPY backend/requerimientos.txt .
RUN pip install --no-cache-dir fastapi uvicorn sqlalchemy pandas scikit-learn plotly mangum aiofiles

# Copy backend source
COPY backend/ .

# Build SQLite DB from pre-processed CSVs
RUN python cargar_csvs.py

# Copy frontend for static file serving
COPY frontend/ frontend/

CMD ["handler.handler"]
