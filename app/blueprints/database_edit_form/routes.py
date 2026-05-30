from . import database_edit_form_bp # from current package importing the database_edit_form_bp from __init__
from flask import render_template, redirect, request, url_for
from .services import * # for forms 
from ...extensions import db # for database
from ...models import * # data models


# this route for batch
@database_edit_form_bp.route("/batch/add",methods=["GET","POST"])
def get_batch():
    batch_form = BATCH()
    # for adding batch
    if request.method == "POST":
            new_batch = Batch(name = batch_form.name.data)# batch here is database object not the form object
            db.session.add(new_batch)
            db.session.commit()
            return redirect(url_for('.get_batch'))


    return render_template("batch_db.html",form = batch_form,data=all_data(Batch,Batch.batch_id))

# this route for teacher
@database_edit_form_bp.route("/teacher/add", methods=["GET","POST"])
def get_teacher():

    teacher_form = TEACHER()
    # for adding batch
    if request.method == "POST":
            new_teacher = Teacher(name = teacher_form.name.data)
            db.session.add(new_teacher)
            db.session.commit()
            return redirect(url_for('.get_teacher'))

    return render_template("teacher_db.html",form = teacher_form,data=all_data(Teacher,Teacher.teacher_id))


# this route for department
@database_edit_form_bp.route("/department/add",methods=["GET","POST"])
def get_department():
    department_form = DEPARTMENT()
    # for adding batch
    if request.method == "POST":
            new_department = Department(name = department_form.name.data)
            db.session.add(new_department)
            db.session.commit()
            return redirect(url_for('.get_department'))

    return render_template("department_db.html",form = department_form,data=all_data(Department,Department.dept_id))

# this route for subject
@database_edit_form_bp.route("/subject/add", methods=["GET","POST"])
def get_subject():
    subject_form = SUBJECT()
    # for adding batch
    if request.method == "POST":
            new_subject = Subject(
                name = subject_form.name.data,
                code = subject_form.code.data
                )
            db.session.add(new_subject)
            db.session.commit()
            return redirect(url_for('.get_subject'))

    return render_template("subject_db.html",form = subject_form,data=all_data(Subject,Subject.subject_id))

# this route for assignment 
@database_edit_form_bp.route("/assignment/add")
def get_assignment():
    return render_template("teacher_assignment_db.html")
