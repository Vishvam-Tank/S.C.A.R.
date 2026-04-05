FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    wget unzip curl git && \
    rm -rf /var/lib/apt/lists/*

RUN wget https://github.com/projectdiscovery/nuclei/releases/download/v3.3.7/nuclei_3.3.7_linux_amd64.zip && \
    unzip nuclei_3.3.7_linux_amd64.zip && \
    mv nuclei /usr/local/bin/ && \
    chmod +x /usr/local/bin/nuclei && \
    rm nuclei_3.3.7_linux_amd64.zip

RUN wget https://github.com/projectdiscovery/httpx/releases/download/v1.6.3/httpx_1.6.3_linux_amd64.zip && \
    unzip httpx_1.6.3_linux_amd64.zip && \
    mv httpx /usr/local/bin/ && \
    chmod +x /usr/local/bin/httpx && \
    rm httpx_1.6.3_linux_amd64.zip

RUN wget https://github.com/projectdiscovery/katana/releases/download/v1.1.0/katana_1.1.0_linux_amd64.zip && \
    unzip katana_1.1.0_linux_amd64.zip && \
    mv katana /usr/local/bin/ && \
    chmod +x /usr/local/bin/katana && \
    rm katana_1.1.0_linux_amd64.zip

RUN wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.4/gitleaks_8.18.4_linux_x64.tar.gz && \
    tar -xzf gitleaks_8.18.4_linux_x64.tar.gz && \
    mv gitleaks /usr/local/bin/ && \
    chmod +x /usr/local/bin/gitleaks && \
    rm gitleaks_8.18.4_linux_x64.tar.gz

RUN pip install --no-cache-dir fastapi uvicorn python-dotenv httpx aiofiles PyGithub anthropic openai

WORKDIR /app

COPY backend/ /app/
COPY nuclei-templates/ /app/nuclei-templates/
COPY fallback-cache/ /app/fallback-cache/
