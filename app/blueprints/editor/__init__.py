from flask import Blueprint
# __init__.py is the entry point the editor folder(package)
# creating the editor blue print ob
editor_bp = Blueprint(
    "editor",
    __name__,
    template_folder="templates")

from . import routes # from current package importing the routes