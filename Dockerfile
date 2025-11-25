# Use Python 3.10
FROM python:3.10

# Install system dependencies (libgomp1 is required for LightGBM)
RUN apt-get update && apt-get install -y \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for caching
COPY backend/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY backend/ .

# Create a writable directory for matplotlib/cache if needed
RUN mkdir -p /app/cache && chmod 777 /app/cache
ENV MPLCONFIGDIR=/app/cache

# Expose port 7860 (Hugging Face default)
EXPOSE 7860

# Start the application using Gunicorn with Uvicorn workers
CMD ["gunicorn", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "main:app", "--bind", "0.0.0.0:7860"]
