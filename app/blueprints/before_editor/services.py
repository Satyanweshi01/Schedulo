from flask_wtf import FlaskForm
from wtforms import StringField, SelectField
from wtforms.validators import DataRequired 

class USERFORM(FlaskForm):
    department = SelectField(label="Department",coerce=int)
    batch = SelectField(label="Batch",coerce=int)