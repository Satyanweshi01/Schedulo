from . import landing_after_bp # from current package importing the landing_after_bp from __init__
from flask import render_template

@landing_after_bp.route("/")
def index():
    return render_template("landing_after.html")