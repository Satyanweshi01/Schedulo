from flask import Blueprint, render_template

# creating the editor blue print ob
editor_bp = Blueprint("editor", __name__, template_folder="templates")

@editor_bp.route("/")
def index():
    return render_template("editor.html")