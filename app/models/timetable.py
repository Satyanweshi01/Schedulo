from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, ForeignKey

class Timetable(db.Model):
    __tablename__="timetables"
    timetable_id: Mapped[int] = mapped_column(Integer, primary_key=True)
#name this will be a string made by week() in editor's services.py
    name: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )
#Fk dept id for filtering
    dept_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("departments.dept_id"),
        nullable=False
    )
#Fk batch id for filering
    batch_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("batches.batch_id"),
        nullable=False
    )
    # track owning user
    created_by: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
    )