# ChainSplit Backend

Backend API for ChainSplit - handles IPFS uploads and other server-side operations.

## Architecture

This backend follows the **Services/Repository Pattern**:

```
src/
├── config/        # Environment configuration
├── controllers/   # Thin request handlers (validation & delegation)
├── services/      # Business logic
├── repositories/  # Data access (future: contract reads)
├── middleware/    # Express middleware
├── types/         # TypeScript definitions
└── utils/         # Utility functions
```

## API Endpoints

### Health
- `GET /api/health` - Health check

### IPFS Pinning
- `POST /api/pin/file` - Upload file to IPFS
- `POST /api/pin/json` - Upload JSON to IPFS
- `GET /api/pin/status` - Check Pinata connection

## Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure Pinata credentials in .env
PINATA_API_KEY=your_key
PINATA_API_SECRET=your_secret

# Run development server
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |
| `CORS_ORIGINS` | Allowed origins | http://localhost:3000 |
| `PINATA_API_KEY` | Pinata API key | - |
| `PINATA_API_SECRET` | Pinata API secret | - |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 60000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 10 |
