from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, ForeignKey

# this is a mapping table where we assign 
# which Teacher teaches which Subject to which Batch under which Department

class TeacherAssignment(db.Model):
    __tablename__ = "teacher_assignments"
    assignment_id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True
        )
    
    # foreign keys
        # teacher
    teacher_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("teachers.teacher_id"),
        nullable=False
    )
        # department
    dept_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("departments.dept_id"),
        nullable=False
    )
        # subject
    subject_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("subjects.subject_id"),
        nullable=False
    )
        # batch 
    batch_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("batches.batch_id"),
        nullable=False
    )