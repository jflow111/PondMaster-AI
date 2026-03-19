#!/bin/bash
gcloud run deploy pondmaster --source . --project project-1884eb1e-dcd4-4c8c-a6c --region europe-west1 --port 8080 --memory 512Mi --allow-unauthenticated --set-env-vars ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
