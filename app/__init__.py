from flask import Flask
from app.blueprints.editor import editor_bp # importing the editor blueprint object

def create_app():
    app = Flask(__name__)
    app.register_blueprint(editor_bp, url_prefix = "/editor") # registering the editor blue print object

    @app.route("/")
    def intro():
        return "Welcome to Schedulo\n Go to /editor for main editor page"

    return app # this return the flask app object
