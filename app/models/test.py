# do not include this file 
# it is just to test the data models

from timetable import Timetable
from timetable_entry import TimeTableEntry

from teacher import Teacher
from batch import Batch
from department import Department
from subject import Subject
from timeslot import Timeslot

timetable1 = Timetable(1)

subject1 = Subject(1,"Physics","BSPH 101")
department1 = Department(1,"CSE",2025)
teacher1 = Teacher(1,"MD sir",department1,subject1)
batch1 = Batch(1,"CS","1st")
timeslot1 = Timeslot("Monday",9,10)

timetableentry1 = TimeTableEntry(1,teacher1,batch1,subject1,timeslot1)

# adding entry in the timetable list
timetable1.entries.append(timetableentry1)

print(timetable1.entries[0].teacher.department.name)

