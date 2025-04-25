from flask import Flask, jsonify, send_file, send_from_directory
from flask_cors import CORS
import os

# Configure Flask to serve React SPA static files
app = Flask(
    __name__,
    static_folder=os.path.join(os.path.dirname(__file__), "..", "dist"),
    static_url_path="",
)
CORS(app)  # Enable CORS for all routes


@app.route("/api/hello", methods=["GET"])
def hello():
    return jsonify({"message": "Hello from Flask!"})


@app.route("/api/hello-image", methods=["GET"])
def hello_image():
    # Create a path to a sample image
    # You would need to place an image in your backend directory
    image_path = os.path.join(os.path.dirname(__file__), "hello_world.png")
    return send_file(image_path, mimetype="image/png")


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5001)


# Catch-all route for React Router paths
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    # Serve static files if they exist, otherwise serve index.html
    static_dir = app.static_folder
    file_path = os.path.join(static_dir, path)
    if path and os.path.exists(file_path):
        return send_from_directory(static_dir, path)
    return send_from_directory(static_dir, "index.html")
