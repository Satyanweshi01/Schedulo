# Class Scheduler App

A Class Scheduler App for education institution.

running virtual environment - `.venv/Scripts/Activate`
virtual env for sankha -`.venv\Scripts\activate.bat`

Python version we are using - `3.12.0`

### Protocols - 
#### Before contributing- 
1. Activate .venv
2. `git pull` - before any code push
#### Push protocol-
1. `git status` - to check the status
2. Inform the team about the code push (to avoid git merge conflict)
3. `git add CHANGED_FILE_NAME` - do not use .
4. `git commit -m "MESSAGE"`
5. `git push`




### Objects to create- 
- TimetableEntry -> each timetable cell should be a object itself
    - id
    - day
    - slot
    - faculty_id
    - subject_id
    - status

- Faculty 
    - id
    - name
    - department
    - subject

- Subject
    - id
    - name
    - code
