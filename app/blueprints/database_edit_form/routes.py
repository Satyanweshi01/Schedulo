from . import database_edit_form_bp # from current package importing the database_edit_form_bp from __init__
from flask import render_template, redirect, request, url_for
from flask_login import login_required
from .services import BATCH,TEACHER,DEPARTMENT,SUBJECT,TEACHERASSIGNMENT,all_data # for forms 
from ...extensions import db # for database
from ...models import * # data models


# this route for batch
@database_edit_form_bp.route("/batch/add",methods=["GET","POST"])
@login_required
def get_batch():
    batch_form = BATCH()
    # for adding batch
    if batch_form.validate_on_submit():
            new_batch = Batch(name = batch_form.name.data)# batch here is database object not the form object
            db.session.add(new_batch)
            db.session.commit()
            return redirect(url_for('.get_batch'))
    
    return render_template("batch_db.html",form = batch_form,data=reversed(all_data(Batch,Batch.batch_id)))

# this route for teacher
@database_edit_form_bp.route("/teacher/add", methods=["GET","POST"])
@login_required
def get_teacher():
    teacher_form = TEACHER()
    # for adding teacher
    if teacher_form.validate_on_submit():
            new_teacher = Teacher(name = teacher_form.name.data)
            db.session.add(new_teacher)
            db.session.commit()
            return redirect(url_for('.get_teacher'))

    return render_template("teacher_db.html",form = teacher_form,data=reversed(all_data(Teacher,Teacher.teacher_id)))


# this route for department
@database_edit_form_bp.route("/department/add",methods=["GET","POST"])
@login_required
def get_department():
    department_form = DEPARTMENT()
    # for adding department
    if department_form.validate_on_submit():
            new_department = Department(name = department_form.name.data)
            db.session.add(new_department)
            db.session.commit()
            return redirect(url_for('.get_department'))

    return render_template("department_db.html",form = department_form,data=reversed(all_data(Department,Department.dept_id)))

# this route for subject
@database_edit_form_bp.route("/subject/add", methods=["GET","POST"])
@login_required
def get_subject():
    subject_form = SUBJECT()
    # for adding subject
    if subject_form.validate_on_submit():
            new_subject = Subject(
                name = subject_form.name.data,
                code = subject_form.code.data
                )
            db.session.add(new_subject)
            db.session.commit()
            return redirect(url_for('.get_subject'))

    return render_template("subject_db.html",form = subject_form,data=reversed(all_data(Subject,Subject.subject_id)))

# this route for assignment 
@database_edit_form_bp.route("/assignment/add",methods=["GET","POST"])
@login_required
def get_assignment():
    teacher_assignment_form = TEACHERASSIGNMENT()
    
    # to populate teacher option
    all_teachers = all_data(Teacher,Teacher.teacher_id)
    teacher_assignment_form.teacher.choices = [(teacher.teacher_id,teacher.name)for teacher in all_teachers]
    # to popolate department option
    all_department = all_data(Department,Department.dept_id)
    teacher_assignment_form.department.choices = [(dept.dept_id,dept.name)for dept in all_department]
    # to popolate batch option
    all_batch = all_data(Batch,Batch.batch_id)
    teacher_assignment_form.batch.choices = [(batch.batch_id,batch.name)for batch in all_batch]
    # to popolate subject option
    all_subject = all_data(Subject,Subject.subject_id)
    teacher_assignment_form.subject.choices = [(subject.subject_id,subject.name)for subject in all_subject]


    # for adding new teacher assignment
    if teacher_assignment_form.validate_on_submit():
            new_assignment = TeacherAssignment(
                teacher_id = teacher_assignment_form.teacher.data,
                dept_id = teacher_assignment_form.department.data,
                batch_id = teacher_assignment_form.batch.data,
                subject_id = teacher_assignment_form.subject.data                
                )
            db.session.add(new_assignment)
            db.session.commit()
            return redirect(url_for('.get_assignment'))

    return render_template("teacher_assignment_db.html",form = teacher_assignment_form, data=reversed(all_data(TeacherAssignment,TeacherAssignment.assignment_id)))

# delete route for batch
@database_edit_form_bp.route("/batch/delete/<int:id>", methods=["POST"])
@login_required
def delete_batch(id):
    batch_to_delete = db.session.execute(db.select(Batch).where(Batch.batch_id==id)).scalar()
    print(id)
    print(batch_to_delete)
    db.session.delete(batch_to_delete)
    db.session.commit()
    return redirect(url_for('.get_batch'))

# delete route for teacher
@database_edit_form_bp.route("/teacher/delete/<int:id>", methods=["POST"])
@login_required
def delete_teacher(id):
    teacher_to_delete = db.session.execute(db.select(Teacher).where(Teacher.teacher_id==id)).scalar()
    db.session.delete(teacher_to_delete)
    db.session.commit()
    return redirect(url_for('.get_teacher'))

# delete route for department
@database_edit_form_bp.route("/department/delete/<int:id>", methods=["POST"])
@login_required
def delete_department(id):
    department_to_delete = db.session.execute(db.select(Department).where(Department.dept_id==id)).scalar()
    db.session.delete(department_to_delete)
    db.session.commit()
    return redirect(url_for('.get_department'))

# delete route for subject
@database_edit_form_bp.route("/subject/delete/<int:id>", methods=["POST"])
@login_required
def delete_subject(id):
    subject_to_delete = db.session.execute(db.select(Subject).where(Subject.subject_id==id)).scalar()
    db.session.delete(subject_to_delete)
    db.session.commit()
    return redirect(url_for('.get_subject'))

# delete route for assignment
@database_edit_form_bp.route("/assignment/delete/<int:id>", methods=["POST"])
@login_required
def delete_assignment(id):
    assignment_to_delete = db.session.execute(db.select(TeacherAssignment).where(TeacherAssignment.assignment_id == id)).scalar()
    db.session.delete(assignment_to_delete)
    db.session.commit()
    return redirect(url_for('.get_assignment'))