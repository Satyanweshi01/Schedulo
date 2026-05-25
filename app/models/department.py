from app.extensions import db
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer

# eg. CSE, CSE AI&ML, IT, ECE
class Department(db.Model):
    __tablename__ = "departments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name : Mapped[int] = mapped_column(String(50), nullable=False, unique=True)
