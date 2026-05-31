from . import before_editor_bp
from flask import render_template, redirect, url_for
from .services import USERFORM
from ...extensions import db # for database
from ...models import * # data models
from ..database_edit_form.services import all_data

@before_editor_bp.route("/userform",methods=["GET","POST"])
def get_editor():
    user_form = USERFORM()
    # to popolate department option
    all_department = all_data(Department,Department.dept_id)
    user_form.department.choices = [(dept.dept_id,dept.name)for dept in all_department]
    # to popolate batch option
    all_batch = all_data(Batch,Batch.batch_id)
    user_form.batch.choices = [(batch.batch_id,batch.name)for batch in all_batch]
    
    # for filteration 
    if user_form.validate_on_submit():
            selected_department = user_form.department.data
            selected_batch = user_form.batch.data
            all_selected_assignned_cards = db.session.execute(
        db.select(TeacherAssignment).where(TeacherAssignment.batch_id==selected_batch ,TeacherAssignment.dept_id==selected_department)
    ).scalars().all()
            return redirect(url_for('editor.index',cards=all_selected_assignned_cards))
    return render_template("before_editor.html",form=user_form)