# Excalidraw Persist

A self-hostable app with server-side persistence and multiple boards based on Excalidraw.

`docker run -p 80:80 -p 4000:4000 ghcr.io/ozencb/excalidraw-persist:latest`

<img width="1440" height="790" alt="Screenshot" src="https://github.com/user-attachments/assets/18f0f065-58d1-42d8-94d6-b29531b4b685" />



## Features

- 💾 Server-side persistence of drawings, images, library objects
- 📑 Multiple boards/tabs support
- 🗑️ Trash functionality for deleted boards
- 🗃️ SQLite database for simple deployment


## TODO
- [ ] Collaboration support

## Development

This project uses pnpm workspaces as a monorepo. Make sure to create a `.env` file with necessary values. You can take a look at `packages/server/.env.example` as a starting point.

### Prerequisites

- [Node.js](https://nodejs.org/) (v22 or newer)
- [pnpm](https://pnpm.io/) (v10 or newer)
- Git

```bash
# Clone the repository
git clone https://github.com/ozencb/excalidraw-persist.git
cd excalidraw-persist

# Install dependencies
pnpm install

# Create environment configuration
cp packages/server/.env.example packages/server/.env

# Start development servers (client and server)
pnpm dev

# Build for production
pnpm build
```

## Deployment Options

### Option 1: Docker (Recommended)

The easiest way to deploy Excalidraw Persist is using Docker and Docker Compose.

#### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

#### Deployment Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/ozencb/excalidraw-persist.git
   cd excalidraw-persist
   ```
2. Start the containers:
   ```bash
   docker-compose up -d
   ```
3. Access the application at `http://localhost` (or your server's IP/domain)

or run

1. `docker run -p 80:80 -p 4000:4000 ghcr.io/ozencb/excalidraw-persist:latest`
2. Access the application at `http://localhost` (or your server's IP/domain)

#### Using npm Scripts

There are some convenience scripts included in the root `package.json`:

- `pnpm docker:build` - Build the Docker images
- `pnpm docker:up` - Start the containers in detached mode
- `pnpm docker:down` - Stop and remove the containers
- `pnpm docker:logs` - View the container logs in follow mode

#### Configuration

The Docker setup uses the following default configuration:

- Client accessible on port 80
- Server API running on port 4001 (mapped to internal port 4000)
- Data persisted in a local `./data` volume

#### Environment Variables

The server container accepts the following environment variables:

- `PORT` - The port the server will listen on (default: 4000)
- `NODE_ENV` - The environment mode (default: production)
- `DB_PATH` - The path to the SQLite database file (default: /app/data/database.sqlite)

You can modify these in the `docker-compose.yml` file:

```yaml
# Example custom configuration
server:
  environment:
    - PORT=4000
    - NODE_ENV=production
    - DB_PATH=/app/data/custom-database.sqlite
```

### Option 2: Manual Deployment

#### Prerequisites

- Node.js (v22 or newer)
- pnpm (v10 or newer)

#### Deployment Steps

1. Clone and prepare the application:
   ```bash
   git clone https://github.com/ozencb/excalidraw-persist.git
   cd excalidraw-persist
   pnpm install
   cp packages/server/.env.example packages/server/.env
   # Configure your .env file
   pnpm build
   ```
2. Start the server:
   ```bash
   pnpm start
   ```
3. For production, consider using a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start pnpm --name "excalidraw-persist" -- start
   pm2 save
   ```
4. Set up a reverse proxy with Nginx or Apache for proper SSL termination

### Troubleshooting

If you encounter issues:

1. Check the application logs:
   - Docker: `docker-compose logs` or `pnpm docker:logs`
   - Manual: Check the console output where the app is running
2. Verify network connectivity:
   - Ensure ports are properly exposed and not blocked by firewalls
   - Verify the server is accessible from the client
3. Database issues:
   - Check that the SQLite database file is being created
   - Ensure the application has write permissions to the database directory

## Backup

The application stores all data in an SQLite database file. To backup your data:

1. **Docker deployment**: Copy the data from the volume:
   ```bash
   cp -r ./data/database.sqlite /your/backup/location/
   ```

2. **Manual deployment**: Copy the SQLite database file from your configured location

## License

MIT
