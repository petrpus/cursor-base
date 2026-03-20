#!/usr/bin/env bash

PROJECT_NAME="agenius"
DEV_ROOT="/tmp/${PROJECT_NAME}-dev"
LOG_DIR="$DEV_ROOT/logs"
RUN_DIR="$DEV_ROOT/run"

APP_NAME="app"
WORKER_NAME="worker"
SCHEDULER_NAME="scheduler"
STUDIO_NAME="studio"

APP_CMD="npm run watch"
WORKER_CMD="npm run jobs:worker"
SCHEDULER_CMD="npm run jobs:scheduler"
STUDIO_CMD="npm run prisma:studio"

INFRA_UP_CMD="npm run infra:up"
INFRA_DOWN_CMD="npm run db:stop && npm run minio:stop && npm run redis:stop"

APP_PORT="3000"
STUDIO_PORT="5555"
POSTGRES_PORT="5432"
REDIS_PORT="6379"
MINIO_API_PORT="9000"
MINIO_CONSOLE_PORT="9001"
