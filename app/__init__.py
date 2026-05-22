from flask import Flask
from app.blueprints.editor import editor_bp # importing the editor blueprint object
#from app.config import Config # configuration
#from app.extensions import db, migrate # database and migration
#from app import models # importing datamodels SQLAlchemy only detects imported models 



def create_app():
    app = Flask(__name__)
    app.register_blueprint(editor_bp, url_prefix = "/editor") # registering the editor blue print object

    #app.config.from_object(Config) # passing the Config class as configuration to the flask app object

    #db.init_app(app) # connection establish between the database and the flask app
    #migrate.init_app(app, db) # migration establish between the database and the flask app


    @app.route("/")
    def intro():
        return "Welcome to Schedulo\n Go to /editor for main editor page"

    return app # this return the flask app object
