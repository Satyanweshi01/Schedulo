from . import editor_bp # from current package importing the editor_bp from __init__
from flask import render_template
from .services import week
from ...extensions import db
from ...models import Teacher

@editor_bp.route("/")
def index():
    # week data
    current_week = week()
    teachers = db.session.execute(
        db.select(Teacher).order_by(Teacher.teacher_id)
    ).scalars().all()
    teacher_data = [
        {"id": teacher.teacher_id, "name": teacher.name}
        for teacher in teachers
    ]
    return render_template("editor.html", week=current_week, teachers=teacher_data)
