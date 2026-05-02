# Release Runbook

## Pre-release Checklist
- Ensure required environment variables are set: `DATABASE_URL`, `JWT_SECRET`, `GEMINI_API_KEY`.
- Validate linting and smoke tests: `pnpm lint && pnpm test:smoke`.
- Validate production build: `pnpm build`.
- Confirm screening and apply APIs respond successfully in staging.

## Deployment Steps
1. Merge to `main` after CI is green.
2. GitHub Actions workflow deploys production through Vercel.
3. Monitor deployment logs and verify API health endpoints/routes manually.

## Post-release Verification
- Login/register flow works.
- Admin can create job and screen a resume.
- Candidate can view jobs and apply with screening answers.
- Pipeline status update works from admin.

## Rollback Procedure
1. Re-deploy previous known good commit from Vercel/GitHub.
2. Confirm old deployment health and traffic recovery.
3. Open incident note with request IDs from logs for failed requests.

## Incident Debugging Inputs
- `requestId` returned from API responses.
- Route path and user role when failure happened.
- Error payload from API logs.
