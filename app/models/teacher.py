from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer

class Teacher(db.Model):
    __tablename__="teachers"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(10), nullable=False)

        # foreign keys -
        # department
        # subject
        # batch 