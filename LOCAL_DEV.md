# Local Development Environment

This directory contains multiple scripts for different development scenarios.

## 🚀 Quick Start Options

### Super Fast (Recommended)
```bash
./dev.sh
```
**Best for daily development** - Starts Firebase emulators + frontend in ~3 seconds

### Simple & Flexible
```bash
./start-simple.sh              # Start both frontend and emulators
./start-simple.sh --frontend   # Frontend only
./start-simple.sh --emulators  # Emulators only
```

### Full Featured (Slower)
```bash
./start-local.sh               # Complete environment with dependency checks
./start-local.sh --clean       # Clean install all dependencies first
```

### Stop Everything
```bash
./stop-local.sh
```

## 🌐 Available Services

Once started, you can access:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Next.js development server |
| **Emulator UI** | http://localhost:4001 | Firebase Emulator dashboard |
| **Functions** | http://localhost:5002 | Firebase Functions emulator |
| **Firestore** | http://localhost:8081 | Firestore emulator |
| **Auth** | http://localhost:9099 | Firebase Auth emulator |
| **DataConnect** | http://localhost:9399 | Firebase DataConnect emulator |
| **Backend API** | http://localhost:5001 | Flask backend server |

## 📋 Script Comparison

| Script | Speed | Features | Best For |
|--------|-------|----------|----------|
| `dev.sh` | ⚡ Fastest | Basic | Daily development |
| `start-simple.sh` | 🔄 Fast | Flexible modes | Testing specific parts |
| `start-local.sh` | 🐌 Slower | Full featured | Initial setup, CI/CD |

## Script Options

### Start Script Options
```bash
./start-local.sh --help        # Show help
./start-local.sh --clean       # Clean install (removes node_modules/venv)
```

## What the Scripts Do

### `start-local.sh`
1. **Cleanup**: Kills any existing processes on the required ports
2. **Dependencies**: Installs/updates npm packages and Python dependencies
3. **Build**: Compiles TypeScript functions
4. **Start Services**: Launches all emulators and development servers
5. **Monitor**: Keeps running until you press Ctrl+C

### `stop-local.sh`
1. **Graceful Shutdown**: Stops all Firebase emulators
2. **Process Cleanup**: Kills frontend and backend servers
3. **Port Cleanup**: Frees up all used ports

## Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# The scripts automatically handle this, but if you need manual cleanup:
./stop-local.sh
```

**Dependencies Issues**
```bash
# Clean install all dependencies:
./start-local.sh --clean
```

**Firebase CLI Issues**
```bash
# Make sure Firebase CLI is installed and logged in:
npm install -g firebase-tools
firebase login
```

**Python Environment Issues**
```bash
# The script creates a virtual environment automatically, but if you have issues:
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Manual Service Management

If you need to start services individually:

```bash
# Frontend only
cd frontend && npm run dev

# Firebase emulators only
firebase emulators:start

# Backend only
cd backend && source venv/bin/activate && python run.py

# Functions only
cd functions && npm run serve
```

## Development Workflow

1. **Start Environment**: `./start-local.sh`
2. **Develop**: Make changes to your code
3. **Test**: Use the emulator UI at http://localhost:4001
4. **Debug**: Check logs in the terminal where you ran the script
5. **Stop**: Press Ctrl+C or run `./stop-local.sh`

## Environment Variables

Make sure you have the necessary environment variables set up:

- **Frontend**: Check `frontend/.env.local` for Firebase config
- **Backend**: Check `backend/.env` for API keys and configuration
- **Functions**: Environment variables are handled by Firebase emulators

## Notes

- The script automatically handles port conflicts and process cleanup
- All services start in development mode with hot reloading enabled
- Firebase emulators use local data that persists between runs
- Press Ctrl+C in the terminal to stop all services gracefully

---

**Happy coding! 🚀**
