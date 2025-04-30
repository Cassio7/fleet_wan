#!/bin/sh
set -e

VERSION=${1:-latest}

echo "Building backend version: $VERSION..."
docker build -t wastetrucker_backend:$VERSION ./backend_fleet
docker tag wastetrucker_backend:$VERSION wastetrucker_backend:latest

echo "Building frontend latest"
docker build -t wastetrucker_frontend ./frontend_fleet

echo "Build completato!"