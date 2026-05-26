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
- [x] SQLite Database creation 
    - Create extensions.py in app directory
    - Establish db object
- [x] Centralized configuration file creation for easier key access
    - Create a config.py in app directory
- [x] Create a stable schemas and data models 
    - Plan the data schemas on paper for clarity
    - Create various sqlalchemy schema objects
    - Test CRUD operation by using it
- [x] Establish migration - for interecting with the database schema
- [ ] CRUD Implemention for each foundation data table
- [ ] Create a dynamic form webpage to interect with all the databse table


### Schema-

#### batch
- batch_id
- name -> eg. 1 year, 2 year

#### department
- dept_id
- name -> eg. CSE, CSE AI&ML, IT, ECE

#### subject
- subject_id
- name
- code

#### teacher
- teacher_id
- name

#### teacherassignments
- assignment_id
- FK teacher_id
- FK dept_id
- FK subject_id
- FK batch_id

#### timeslot
- timeslot_id
- day
- start_time
- end_time
- slot_order (this is for easier rendering)

#### timetable_entry
- tt_entry_id
- FK ta_id (this is id of teacherassignment)
- FK timeslot_id
- FK timetable_id

#### timetable
- timetable_id
- name
- FK dept_id
- FK batch_id

### Data model process -
Teacher, Batch, Department, Subject -> TeacherAssignment ,TeacherAssignment, TimeSlot -> TimetableEntry -> Timetable

### Interecting with migration

DO NOT PLAY WITH THIS IF YOU DO NOT KNOW WHAT YOU ARE DOING

flask db migrate -m "message" -> to add new database schema

flask db upgrade -> update the schema

flask db downgrade -> to rollback migration

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
- instance -> this is where database lives
- migrations -> this is where middle guy lives
- .gitignore -> to avoid uploading unnecessary folders
- LICENCE -> for licencing
- README.md -> for documentation purpose
- requirments.txt -> to list all the needed library
- run.py -> the main python file which calls the `create_app()` and starts the server.

### Front-End Components (HTML/CSS/JS)

#### HTML (editor.html)
- **Schedule Grid**: 5x9 table layout showing days (Mon-Fri) and 9 time slots (10:00-17:20)
- **Recess Indicators**: Marked in red for break times at position 12:30-1:20
- **Faculty Panel**: Right sidebar with search box and teacher cards for selection
- **Control Panel**: Bottom section with OK button and PDF export button

#### CSS (editor.css)
- **Grid Layout**: Responsive CSS Grid for main layout (4fr 1fr columns, 8fr 1fr rows)
- **Color Scheme**: Light theme with highlights for interactive elements
- **Hover Effects**: Visual feedback for clickable elements
- **Selection States**: Green highlight for selected teachers
- **Button Styling**: OK button (orange) and Download PDF button (green) with hover effects

#### JavaScript (editor.js)
- **Schedule State Management**: Global state object managing all schedule data (no persistence)
- **Teacher Selection**: Click teacher cards to select; selected teacher tracked in state
- **Search Filter**: Real-time filtering of teacher cards by name
- **JSON Storage**: Stores schedule JSON in variable when "OK" button is pressed (not downloaded)
- **Backend Ready**: Stored JSON accessible via `getStoredJSON()` for backend processing

### How to Use the Schedulo Editor

#### Basic Workflow
1. **Start the Flask Server**: 
   - Activate venv: `.venv/Scripts/Activate` (Windows)
   - Run: `python run.py`
   - Open browser to the editor route

2. **Selecting Teachers**:
   - Click a teacher card from the right panel to select (turns green)
   - Only one teacher can be selected at a time

3. **Searching Teachers**:
   - Type in the search box to filter teacher list
   - Search is case-insensitive and matches partial names

4. **Storing Schedule Data**:
   - Click "OK" button to store schedule JSON in a variable
   - A confirmation message displays when data is stored
   - Stored data is ready to be submitted to backend

5. **Exporting to PDF** (placeholder):
   - Click "Download PDF" button for future PDF export functionality

#### JSON Structure
The JSON stored in the variable when "OK" is pressed contains:
```json
{
  "metadata": {
    "creationDate": "2026-05-23T12:00:00.000Z",
    "institution": "Your Institution Name"
  },
  "schedule": {
    "Monday": {
      "10:00-10:50": {
        "subject": "",
        "teacher": "",
        "stream": ""
      },
      ...
    },
    "Tuesday": { ... },
    "Wednesday": { ... },
    "Thursday": { ... },
    "Friday": { ... }
  },
  "teachers": [
    { "id": 1, "name": "Dr. Smith" },
    { "id": 2, "name": "Prof. Johnson" },
    ...
  ]
}
```

#### Browser Console Commands
- `getStoredJSON()` - retrieve the stored schedule JSON (returns null if not yet stored)
- `generateScheduleJSON()` - generate JSON from current schedule state
- `storeScheduleJSON()` - manually store JSON (same as clicking OK button)
- `submitScheduleToBackend()` - submit stored JSON to backend (implementation pending)

#### Key Points
- **No Cell Editing**: Schedule grid is for display only; teacher selection and data is managed via the state
- **No Local Storage**: All data stays in memory during the session (no persistence between page refreshes)
- **No Week Navigation**: Fixed schedule view (no date range changes)
- **Simple Data Flow**: Select teachers → Click OK → JSON is stored → Ready for backend submission

### Features Summary
✓ Interactive teacher selection panel
✓ Real-time search filter for teachers
✓ Schedule grid display (5 days × 9 time slots)
✓ JSON storage in variable for backend processing
✓ Clean, responsive UI with visual feedback
✓ Fully commented code for maintainability
✓ No persistence (session-only data)

