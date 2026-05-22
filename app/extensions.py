from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from flask_migrate import Migrate

class Base(DeclarativeBase):
    pass
# database manager object
db = SQLAlchemy(model_class=Base)

# the migration object
migrate = Migrate()