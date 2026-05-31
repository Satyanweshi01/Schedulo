from flask_wtf import FlaskForm
from wtforms import StringField, SelectField
from wtforms.validators import DataRequired 
from ...extensions import db

# batch form
class BATCH(FlaskForm):
    name = StringField(label="Name", validators= [DataRequired()])

# department form
class DEPARTMENT(FlaskForm):
    name = StringField(label="Name", validators= [DataRequired()])

# subject form
class SUBJECT(FlaskForm):
    name = StringField(label="Subject Name", validators= [DataRequired()])
    code = StringField(label="Subject Code", validators= [DataRequired()])

# teacher form
class TEACHER(FlaskForm):
    name = StringField(label="Teacher Name", validators= [DataRequired()])

# teacher assignment form
class TEACHERASSIGNMENT(FlaskForm):
    teacher = SelectField(label="Teacher",coerce=int)
    department =  SelectField(label="Department",coerce=int)
    batch = SelectField(label="Batch",coerce=int)
    subject = SelectField(label="Subject",coerce=int)



# function for getting hold on the data
def all_data(model, order_column):
    return db.session.execute(
        db.select(model).order_by(order_column)
    ).scalars().all()
