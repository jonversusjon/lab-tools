from flask import Flask, jsonify, send_file
from flask_cors import CORS
import os

app = Flask(__name__)
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
