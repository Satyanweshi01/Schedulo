from . import editor_bp # from current package importing the editor_bp from __init__
from flask import render_template
from .services import week

@editor_bp.route("/")
def index():
    # week data
    current_week = week()
    return render_template("editor.html",week=current_week)