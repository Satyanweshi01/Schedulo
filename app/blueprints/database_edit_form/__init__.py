from flask import Blueprint
# __init__.py is the entry point the database_edit_form folder(package)
# creating the database_edit_form blue print ob
database_edit_form_bp = Blueprint(
    "database_edit_form",
    __name__,
    template_folder="templates")

from . import routes # from current package importing the routes