from . import landing_after_bp # from current package importing the landing_after_bp from __init__
from flask import render_template
from ..database_edit_form import routes # importing routes for the database_edit_form for the intra page linkage
@landing_after_bp.route("/")
def index():
    return render_template("landing_after.html")