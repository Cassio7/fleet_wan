#!/bin/sh
cd backend_fleet && docker build -t wastetrucker_backend . 
cd ..
cd frontend_fleet && docker build -t wastetrucker_frontend .