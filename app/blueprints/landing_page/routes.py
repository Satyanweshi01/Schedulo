from . import landing_page_bp # from current package importing the editor_bp from __init__
from flask import render_template

@landing_page_bp.route("/")
def home():
    return render_template("landing_page.html")