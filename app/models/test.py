# do not include this file 
# it is just to test the data models

from timetable import Timetable
from timetable_entry import TimeTableEntry

from teacher import Teacher
from batch import Batch
from subject import Subject
from timeslot import Timeslot

timetable1 = Timetable()

teacher1 = Teacher(1,"MD sir")
subject1 = Subject(1,"Physics","BSPH 101")
batch1 = Batch(1,"CS","1st")
timeslot1 = Timeslot("Monday",9,10)

timetableentry1 = TimeTableEntry(1,teacher1,batch1,subject1,timeslot1)

# adding entry in the timetable list
timetable1.entries.append(timetableentry1)

print(timetable1.entries[0].teacher.name)

