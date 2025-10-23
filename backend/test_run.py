#!/usr/bin/env python3

import os
import sys
import traceback

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from app import create_app
    
    print("Creating Flask app...")
    app = create_app()
    
    print("App created successfully")
    
    # Get port from environment
    port = int(os.getenv('PORT', 5001))
    
    print(f"Starting app on port {port}...")
    
    # Run without auto-reload to avoid issues
    app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False)
    
except Exception as e:
    print(f"Error starting Flask app: {e}")
    traceback.print_exc()
    sys.exit(1)
