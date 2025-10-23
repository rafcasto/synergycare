from app import create_app
import os

app = create_app()

if __name__ == '__main__':
    # Get port from environment or config, with fallback
    port = int(os.getenv('PORT', app.config.get('PORT', 5000)))
    debug = app.config.get('DEBUG', True)
    
    print(f"Starting Flask app on port {port} (debug={debug})")
    
    # In development, disable auto-reloader to avoid port binding issues
    use_reloader = False if os.getenv('FLASK_ENV') == 'development' else debug
    
    app.run(host='0.0.0.0', port=port, debug=debug, use_reloader=use_reloader)