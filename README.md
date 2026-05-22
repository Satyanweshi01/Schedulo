# Class Scheduler App

A Class Scheduler App for education institution.

running virtual environment - `.venv/Scripts/Activate`
virtual env for sankha -`.venv\Scripts\activate.bat`

Python version we are using - `3.12.0`

### Protocols-

#### Before contributing-

1. Activate .venv - `.venv/Scripts/Activate`(For Windows)
2. `git checkout dev` - to confirm you are making changes on the development branch
3. `git pull` - before any code push

#### Push protocol-

1. `git status` - to check the status
2. Inform the team about the code push (to avoid git **merge conflict**)
3. `git add CHANGED_FILE_NAME` - do not use `add .`
4. `git commit -m "COMMIT_MESSAGE"`
5. `git push`

### Objects-
- Timetable
    - id
    - entries as list

- TimetableEntry -> each timetable cell should be a object itself
    - id
    - teacher
    - batch
    - subject
    - time_slot

- Teacher
    - id
    - name
    - department
    - subject

- Batch
    - id
    - name
    - year

- Department
    - id 
    - name
    - year

- Subject
    - id
    - name
    - code

- Timeslot
    - day
    - start_time
    - end_time

### Data model process -
Teacher, Batch, Department, Subject, TimeSlot -> TimetableEntry -> Timetable

### File Structure
- app -> main app 
    - blueprints -> contains all the flask blueprints
        - editor -> contains editor blueprint
            - templates -> contains all the editor's templates
            - `__init__`.py -> editor blueprint initialisation. entry ofthe editor as package
            - routes.py -> contains all the routes
    - models -> have all the data models
    - static -> one shared static folder for all the blueprints
    - app.py -> the main flask application file to combine all the blueprints
- .gitignore -> to avoid uploading unnecessary folders
- LICENCE -> for licencing
- README.md -> for documentation purpose
- requirments.txt -> to list all the needed library