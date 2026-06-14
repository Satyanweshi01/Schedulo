from . import landing_after_bp # from current package importing the landing_after_bp from __init__
from flask import render_template
from ..database_edit_form import routes # importing routes for the database_edit_form for the intra page linkage
from ...extensions import db
from ...models import Batch, Department, TimeTableEntry, Timetable
from flask_login import current_user


@landing_after_bp.route("/")
def index():
    stmt = (
        db.select(Timetable, Department, Batch)
        .join(Department, Timetable.dept_id == Department.dept_id)
        .join(Batch, Timetable.batch_id == Batch.batch_id)
        .order_by(Timetable.timetable_id.desc())
    )
    if current_user.is_authenticated:
        stmt = stmt.where(Timetable.created_by == current_user.id)

    timetables = db.session.execute(stmt).all()
    history = [
        {
            "id": timetable.timetable_id,
            "name": timetable.name,
            "department": department.name,
            "batch": batch.name,
            "dept_id": department.dept_id,
            "batch_id": batch.batch_id,
            "entries": entry_count(timetable.timetable_id),
        }
        for timetable, department, batch in timetables
    ]
    return render_template("landing_after.html", history=history)


def entry_count(timetable_id):
    return db.session.execute(
        db.select(db.func.count(TimeTableEntry.tt_entry_id)).where(
            TimeTableEntry.timetable_id == timetable_id
        )
    ).scalar() or 0
