from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, ForeignKey

class TimeTableEntry(db.Model):
    __tablename__="timetableentries"
    tt_entry_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # assignment id
    ta_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("teacher_assignments.assignment_id"),
        nullable=False
    )
    # timeslot id
    timeslot_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("timeslots.timeslot_id"),
        nullable=False
    )
    # timetable id (Grandfather's id)
    timetable_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("timetables.timetable_id"),
        nullable=False
    )


