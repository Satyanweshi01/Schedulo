from flask import Blueprint
before_editor_bp = Blueprint(
    "before_editor",
    __name__,
    template_folder="templates"
)
from . import routes