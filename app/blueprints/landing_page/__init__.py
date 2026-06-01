from flask import Blueprint

landing_page_bp = Blueprint(
    "landing page",
    __name__,
    template_folder="templates"
)
from . import routes