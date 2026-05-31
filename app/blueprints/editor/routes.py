from . import editor_bp # from current package importing the editor_bp from __init__
from flask import render_template, request
from .services import week

@editor_bp.route("/")
def index():
    # week data
    current_week = week()
    dept_id = request.args.get("dept_id",type=int)
    batch_id = request.args.get("batch_id",type=int)

    cards = db.session.execute(
        db.select(TeacherAssignment).where(
            TeacherAssignment.batch_id == batch_id,
            TeacherAssignment.dept_id == dept_id
        )
    ).scalars().all()
    # eta json banache cards theke
    cards_json = [
    {
        "assignment_id": card.assignment_id,
        "teacher_id": card.teacher.teacher_id,
        "teacher_name": card.teacher.name,
        "subject_id": card.subject.subject_id,
        "subject_name": card.subject.name,
        "batch_id": card.batch.batch_id,
        "batch_name": card.batch.name
    }
    for card in cards
    ]
    return render_template("editor.html",week=current_week,cards_json=cards_json)
