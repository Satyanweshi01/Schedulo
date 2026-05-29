from . import database_edit_form_bp # from current package importing the database_edit_form_bp from __init__
from flask import render_template

# this route for teacher
@database_edit_form_bp.route("/teacher/add")
def get_teacher():
    return render_template("teacher_db.html")

# this route for department
@database_edit_form_bp.route("/department/add")
def get_department():
    return render_template("department_db.html")

# this route for batch
@database_edit_form_bp.route("/batch/add")
def get_batch():
    return render_template("batch_db.html")

# this route for subject
@database_edit_form_bp.route("/subject/add")
def get_subject():
    return render_template("subject_db.html")

# this route for assignment 
@database_edit_form_bp.route("/assignment/add")
def get_assignment():
    return render_template("teacher_assignment_db.html")
