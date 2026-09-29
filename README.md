# Student Placement Portal

## Run locally

Start MongoDB locally, then run the backend and frontend in separate terminals:

```sh
npm run backend
npm run frontend
```

The backend uses `mongodb://127.0.0.1:27017/student-placement-portal` during development, even if a production `MONGO_URI` is present in `server/.env`. Set `LOCAL_MONGO_URI` to choose a different local development database. Production uses `MONGO_URI`. During local development, API requests and uploaded documents use the local backend and `server/uploads`; Vercel Blob storage is used only in production.

Open the frontend at `http://localhost:5175`.