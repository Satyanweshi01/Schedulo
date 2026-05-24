from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer
 
# eg. 1 year, 2 year
class Batch(db.Model):
    __tablename__ = "batches"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)

