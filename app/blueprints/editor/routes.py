from . import editor_bp # from current package importing the editor_bp from __init__
from flask import render_template

@editor_bp.route("/")
def index():
    return render_template("editor.html")