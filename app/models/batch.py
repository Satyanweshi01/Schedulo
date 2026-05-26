from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String
 
# eg. 1 year, 2 year
class Batch(db.Model):
    __tablename__ = "batches"
    batch_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
    )
    name: Mapped[str] = mapped_column(
        String(50),
        nullable=False) 

