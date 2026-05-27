from . import database_edit_form_bp # from current package importing the database_edit_form_bp from __init__
from flask import render_template

@database_edit_form_bp.route("/")
def index():
    return render_template("database_edit_form.html")