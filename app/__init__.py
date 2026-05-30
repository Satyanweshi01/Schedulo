from flask import Flask
from app.config import Config # configuration
from app.extensions import db, migrate # database and migration
from app import models # importing datamodels because SQLAlchemy only detects imported models 
# blueprints
from app.blueprints.editor import editor_bp # importing the editor blueprint object
from app.blueprints.landing_page import landing_page_bp
from app.blueprints.landing_after import landing_after_bp
from app.blueprints.database_edit_form import database_edit_form_bp


def create_app():
    app = Flask(__name__)
    app.register_blueprint(editor_bp, url_prefix = "/editor") # registering the editor blue print object
    app.register_blueprint(landing_page_bp)
    app.register_blueprint(landing_after_bp, url_prefix ="/home")
    app.register_blueprint(database_edit_form_bp)

    app.config.from_object(Config) # passing the Config class as configuration to the flask app object
    app.secret_key = "sejfaofidsfsdfdfosdif" # csrf token for the form

    db.init_app(app) # connection establish between the database and the flask app
    migrate.init_app(app, db) # migration establish between the database and the flask app



    return app # this return the flask app object
