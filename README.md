# Jeremy Cruz – Personal Site (Frontend)

React + Redux frontend for a personal site: About Me and Projects (e.g. vocal isolation models), with the backend served separately.

## Setup

```bash
npm install
npm run dev
```

Set the backend URL via environment:

```bash
cp .env.example .env
# Edit .env: set VITE_API_URL to your backend base URL (e.g. http://localhost:3000)
```

## Backend API contract

**Projects API** (`VITE_API_URL`):

- **GET /api/projects** — Response: `{ projects: [...] }` or array. Project shape: `{ id?, name, description?, link?, tags? }`.

**Stem Separation API** (`VITE_SEPARATE_API_URL`, default `http://localhost:8000`):

- **GET /** — API info and available models.
- **POST /separate?model=stems|vocals** — Form-data `file` (WAV, MP3, FLAC, OGG, M4A). Returns `application/zip` with separated stems.

Place your resume PDF in `public/` as `resume_2025-11.pdf` so the Home page download link works.

## CI/CD

Deploys to EC2 on push to `main` (build Docker image, push to ECR, run container on EC2). See [.github/DEPLOY.md](.github/DEPLOY.md) for required secrets and variables.

## Docker

```bash
docker build -t cap-frontend .
docker run -p 80:80 cap-frontend
```

To set API URLs at build time:
```bash
docker build --build-arg VITE_API_URL=https://api.example.com --build-arg VITE_SEPARATE_API_URL=https://separate.example.com -t cap-frontend .
```

## Scripts

- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run preview` – preview production build

## Color scheme

Defined in `src/index.css` as CSS variables: main `#1E4E49`, lighter `#C4C4C4`, accent `#93C683`, base `#FFFFFF`, dark `#000000`.
