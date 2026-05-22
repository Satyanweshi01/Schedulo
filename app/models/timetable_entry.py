from app.extensions import db
class TimeTableEntry():
    def __init__(self, id, teacher,batch,subject,timeslot):
        self.id = id
        self.teacher = teacher
        self.batch = batch
        self.subject = subject
        self.timeslot = timeslot


