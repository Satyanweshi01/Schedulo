from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# database manager object
db = SQLAlchemy()

# the migration object
migrate = Migrate()