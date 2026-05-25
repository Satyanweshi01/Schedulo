from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer

class Timetable(db.Model):
    __tablename__="timetable"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # batch
    # department
    # timetableentry
    # week
