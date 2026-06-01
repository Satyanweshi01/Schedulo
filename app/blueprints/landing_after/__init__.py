from flask import Blueprint
# __init__.py is the entry point the landing_after folder(package)
# creating the landing_after blue print ob
landing_after_bp = Blueprint(
    "landing_after",
    __name__,
    template_folder="templates")

from . import routes # from current package importing the routes