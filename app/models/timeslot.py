from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer

class Timeslot(db.Model):
    __tablename__="timeslots"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    day: Mapped[str] = mapped_column(String(10), nullable=False)
    start_time: Mapped[str] = mapped_column(String(10), nullable=False)
    end_time: Mapped[str] = mapped_column(String(10), nullable=False)
        