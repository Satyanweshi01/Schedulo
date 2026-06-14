from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from flask_migrate import Migrate
from flask_login import LoginManager

class Base(DeclarativeBase):
    pass
# database manager object
db = SQLAlchemy(model_class=Base)

# the migration object
migrate = Migrate()

# flask-login manager
login_manager = LoginManager()
login_manager.login_view = "auth.login"