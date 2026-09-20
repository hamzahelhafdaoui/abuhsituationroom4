# Google Cloud Run deployment

This app can run on Cloud Run as a containerized Node service. Cloud Run is a better fit than static hosting because the app uses TanStack server functions and live data fetchers.

## One-time setup

Install the Google Cloud CLI, sign in, and select a project with billing enabled:

```sh
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

## Deploy

From the repository root:

```sh
gcloud run deploy abu-situation-room \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 2
```

Cloud Run injects `PORT`; the Dockerfile starts the production preview server on that port. `--min-instances 0` lets the service scale to zero when idle.

## Cost note

Cloud Run has a monthly free tier in eligible regions such as `us-central1`, but Google Cloud still generally requires a billing account for deployment.
