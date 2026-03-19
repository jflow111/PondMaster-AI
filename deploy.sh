#!/bin/bash
SA="612543858921-compute@developer.gserviceaccount.com"
PROJECT="project-1884eb1e-dcd4-4c8c-a6c"
REGION="europe-west1"

gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$SA" \
  --role="roles/storage.admin"

gcloud run deploy pondmaster \
  --source . \
  --project $PROJECT \
  --region $REGION \
  --port 8080 \
  --memory 512Mi \
  --allow-unauthenticated \
  --set-env-vars ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
