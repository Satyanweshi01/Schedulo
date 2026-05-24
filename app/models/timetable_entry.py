from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer

class TimeTableEntry(db.Model):
    __tablename__="timetableentries"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)


        # teacher
        # subject
        # timeslot


