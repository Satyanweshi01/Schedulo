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

### Tasks to complete
- [x] Restructure the entire project and split the responsibilities for modularity
- [ ] SQLite Database creation 
    - Create extensions.py in app directory
    - Establish db object
- [ ] Centralized configuration file creation for easier key access
    - Create a config.py in app directory
- [ ] Create a stable schemas and data models 
    - Plan the data schemas on paper for clarity
    - Create various sqlalchemy schema objects
    - Test CRUD operation by using it
- [ ] Establish migration - for interecting with the database schema


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
                - `editor.html` -> main editor interface with schedule grid, faculty panel, and controls
            - `__init__`.py -> editor blueprint initialisation. entry of the editor as package
            - routes.py -> contains all the routes
            - services.py -> contains all the logic and computation
    - models -> have all the data models
    - static -> one shared static folder for all the blueprints
        - css -> stylesheets
            - `editor.css` -> styling for schedule grid, faculty panel, controls, and interactive elements
        - js -> javascript files
            - `editor.js` -> client-side logic for schedule management, JSON export, and local storage
        - images -> image assets
    - `__init__`.py -> the main flask application file to combine all the blueprints and return the flask app object.
    - config.py -> contains a Config class which store all the configuration needed for the flask app.
    - extensions.py -> contains all the extra needed object e.g. - database initialisation, migration initialisation etc.
- .gitignore -> to avoid uploading unnecessary folders
- LICENCE -> for licencing
- README.md -> for documentation purpose
- requirments.txt -> to list all the needed library
- run.py -> the main python file which calls the `create_app()` and starts the server.

### Front-End Components (HTML/CSS/JS)

#### HTML (editor.html)
- **Schedule Grid**: 5x9 table layout showing days (Mon-Fri) and 9 time slots (10:00-17:20)
- **Recess Indicators**: Marked in red for break times at position 12:30-1:20
- **Faculty Panel**: Right sidebar with search box and teacher cards for assignment
- **Control Panel**: Bottom section with week navigation and PDF export button

#### CSS (editor.css)
- **Grid Layout**: Responsive CSS Grid for main layout (4fr 1fr columns, 8fr 1fr rows)
- **Color Scheme**: Light theme with highlights for interactive elements
- **Hover Effects**: Visual feedback for clickable cells and buttons
- **Selection States**: Green highlight for selected teachers
- **Responsive Design**: Flexbox for faculty cards and control buttons

#### JavaScript (editor.js)
- **Schedule State Management**: Global state object managing all schedule data
- **Cell Editing**: Click any time slot to add subject name (prompt-based input)
- **Teacher Selection**: Click teacher cards to select; selected teacher assigned to entries
- **Week Navigation**: Previous/Next buttons to navigate weeks with date updates
- **Search Filter**: Real-time filtering of teacher cards by name
- **Local Storage**: Auto-saves schedule to browser storage for persistence
- **JSON Export**: Generates structured JSON file with schedule metadata

### How to Use the Schedulo Editor

#### Basic Workflow
1. **Start the Flask Server**: 
   - Activate venv: `.venv/Scripts/Activate` (Windows)
   - Run: `python run.py`
   - Open browser to the editor route

2. **Adding Subjects to Schedule**:
   - Click on any empty time slot cell
   - Enter subject name in the prompt dialog
   - Subject appears in the cell with light green background

3. **Assigning Teachers**:
   - Click a teacher card from the right panel to select (turns green)
   - Add subjects after selecting - teacher is recorded with the entry
   - Can change selection by clicking another teacher

4. **Searching Teachers**:
   - Type in the search box to filter teacher list
   - Search is case-insensitive and matches partial names

5. **Navigating Weeks**:
   - Click the left arrow (◄) to go to previous week
   - Click the right arrow (►) to go to next week
   - Date range updates automatically in the control panel

6. **Exporting Schedule**:
   - Click "Download PDF" button to export schedule as JSON
   - JSON file includes:
     - Metadata (export date, week range, institution)
     - Complete schedule structure (day → time slot → subject/teacher/stream)
     - List of all teachers
   - Also accessible via browser console: `downloadScheduleJSON()`
   - Or clear schedule: `clearSchedule()`

#### JSON Export Format
```json
{
  "metadata": {
    "exportDate": "2026-05-23T12:00:00.000Z",
    "weekStart": "23 May 2026",
    "weekEnd": "27 May 2026",
    "institution": "Your Institution Name"
  },
  "schedule": {
    "Monday": {
      "10:00-10:50": {
        "subject": "Mathematics",
        "teacher": "Dr. Smith",
        "stream": "CSE"
      },
      ...
    }
  },
  "teachers": [
    { "id": 1, "name": "Dr. Smith" },
    ...
  ],
  "metadata_info": {
    "description": "Class schedule data exported from Schedulo",
    "version": "1.0",
    "format": "JSON"
  }
}
```

#### Browser Console Commands
- `exportScheduleJSON()` - returns current schedule as JSON object
- `downloadScheduleJSON()` - downloads schedule as JSON file
- `clearSchedule()` - clears all schedule data (with confirmation)

### Features Summary
✓ Interactive schedule grid (click to add subjects)
✓ Teacher selection and assignment
✓ Week navigation with date tracking
✓ Real-time search filter for teachers
✓ Automatic data persistence (local storage)
✓ JSON export with comprehensive metadata
✓ Responsive UI with visual feedback
✓ Fully commented code for maintainability

