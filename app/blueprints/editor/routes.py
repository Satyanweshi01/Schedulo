from . import editor_bp # from current package importing the editor_bp from __init__
from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape

from flask import current_app, render_template, request, jsonify, send_file, url_for
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from .services import week
from ...extensions import db
from ...models import *


@editor_bp.route("/")
def index():
    # week data
    current_week = week()
    dept_id = request.args.get("dept_id",type=int)
    batch_id = request.args.get("batch_id",type=int)
    department = db.session.get(Department, dept_id) if dept_id else None
    batch = db.session.get(Batch, batch_id) if batch_id else None
    editor_context = {
        "dept_id": dept_id,
        "batch_id": batch_id,
        "department_name": department.name if department else "",
        "batch_name": batch.name if batch else "",
        "week": current_week,
        "college_name": "BENGAL INSTITUTE OF TECHNOLOGY",
    }
    current_timetable = get_timetable(current_week, dept_id, batch_id)

    cards = db.session.execute(
        db.select(TeacherAssignment).where(
            TeacherAssignment.batch_id == batch_id,
            TeacherAssignment.dept_id == dept_id
        )
    ).scalars().all()
    # eta json banache cards theke

    cards_json = [
    {
        "assignment_id": card.assignment_id,
        "teacher_id": card.teacher.teacher_id,
        "teacher_name": card.teacher.name,
        "subject_id": card.subject.subject_id,
        "subject_name": card.subject.name,
        "batch_id": card.batch.batch_id,
        "batch_name": card.batch.name,
        "department_id": card.department.dept_id,
        "department_name": card.department.name,
        "assignment_count": count_teacher_assignments(card.teacher_id),
        "other_assignments": teacher_assignment_labels(card.teacher_id, card.assignment_id),
    }
    for card in cards
    ]

    # for card in cards:
    #     cards_json = ({
    #         "assignment_id": card.assignment_id,
    #         "teacher_id": card.teacher.teacher_id,
    #         "teacher_name": card.teacher.name,
    #         "subject_id": card.subject.subject_id,
    #         "subject_name": card.subject.name,
    #         "batch_id": card.batch.batch_id,
    #         "batch_name": card.batch.name
    #     })

    return render_template(
        "editor.html",
        week=current_week,
        cards_json=cards_json,
        editor_context=editor_context,
        saved_schedule=load_saved_schedule(current_timetable),
        teacher_conflicts=load_teacher_conflicts(current_week, current_timetable),
    )


@editor_bp.route("/save", methods=["POST"])
def save_timetable():
    payload = request.get_json(silent=True) or {}
    metadata = payload.get("metadata", {})
    schedule = payload.get("schedule", {})
    days = payload.get("days", [])
    time_slots = payload.get("timeSlots", [])

    dept_id = metadata.get("deptId")
    batch_id = metadata.get("batchId")
    timetable_name = metadata.get("week") or week()

    if not dept_id or not batch_id:
        return jsonify({"ok": False, "message": "Choose department and batch before saving."}), 400

    timetable = get_or_create_timetable(timetable_name, int(dept_id), int(batch_id))
    conflicts = find_save_conflicts(schedule, days, time_slots, timetable, timetable_name)
    if conflicts:
        return jsonify({
            "ok": False,
            "message": "Teacher clash found. Fix the highlighted slots before saving.",
            "conflicts": conflicts,
        }), 409

    db.session.execute(
        db.delete(TimeTableEntry).where(TimeTableEntry.timetable_id == timetable.timetable_id)
    )

    saved_count = 0
    for day_index, day in enumerate(days):
        for slot_index, slot_label in enumerate(time_slots):
            entry = schedule.get(day, {}).get(slot_label, {})
            assignment_id = entry.get("assignmentId")
            if not assignment_id:
                continue

            timeslot = get_or_create_timeslot(day, slot_label, day_index, slot_index)
            db.session.add(TimeTableEntry(
                ta_id=int(assignment_id),
                timeslot_id=timeslot.timeslot_id,
                timetable_id=timetable.timetable_id,
            ))
            saved_count += 1

    db.session.commit()
    return jsonify({"ok": True, "message": f"Saved {saved_count} scheduled classes."})


@editor_bp.route("/pdf", methods=["GET", "POST"])
def pdf_preview():
    payload = request.get_json(silent=True) or {}
    return render_template(
        "pdf.html",
        payload=payload,
        college_name=payload.get("metadata", {}).get("collegeName", "BENGAL INSTITUTE OF TECHNOLOGY"),
        logo_url=url_for("static", filename="images/bit_logo.jpg"),
    )


@editor_bp.route("/export_pdf", methods=["POST"])
def export_pdf():
    payload = request.get_json(silent=True) or {}
    pdf_file = build_timetable_pdf(payload)
    return send_file(
        pdf_file,
        mimetype="application/pdf",
        as_attachment=True,
        download_name="schedulo-timetable.pdf",
    )


def build_timetable_pdf(payload):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=0.25 * inch,
        leftMargin=0.25 * inch,
        topMargin=0.2 * inch,
        bottomMargin=0.2 * inch,
    )

    metadata = payload.get("metadata", {})
    schedule = payload.get("schedule", {})
    days = payload.get("days", ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
    time_slots = payload.get("timeSlots", [])
    college_name = metadata.get("collegeName") or "BENGAL INSTITUTE OF TECHNOLOGY"
    batch_name = metadata.get("batchName") or ""
    department_name = metadata.get("departmentName") or ""
    week = metadata.get("week") or ""

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "RoutineTitle",
        parent=styles["Title"],
        alignment=TA_CENTER,
        fontSize=17,
        leading=20,
        spaceAfter=2,
    )
    subtitle_style = ParagraphStyle(
        "RoutineSubtitle",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        fontSize=10,
        leading=12,
    )
    cell_style = ParagraphStyle(
        "RoutineCell",
        parent=styles["Normal"],
        alignment=TA_CENTER,
        fontSize=7,
        leading=8,
    )
    header_style = ParagraphStyle(
        "RoutineHeader",
        parent=cell_style,
        fontSize=7,
        leading=8,
    )

    story = []
    logo_path = Path(current_app.static_folder) / "images" / "bit_logo.jpg"
    try:
        logo = Image(str(logo_path), width=0.7 * inch, height=0.7 * inch)
        header_table = Table(
            [[logo, Paragraph(college_name, title_style)]],
            colWidths=[0.9 * inch, 9.8 * inch],
        )
        header_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("BOX", (0, 0), (-1, -1), 0, colors.white),
        ]))
        story.append(header_table)
    except Exception:
        story.append(Paragraph(college_name, title_style))

    subtitle = "CLASS ROUTINE"
    if department_name or batch_name:
        subtitle += f" - {department_name} {batch_name}".strip()
    if week:
        subtitle += f" ({week})"
    story.append(Paragraph(subtitle, subtitle_style))
    story.append(Spacer(1, 0.15 * inch))

    story.append(build_routine_table(days, schedule, time_slots, department_name, cell_style, header_style))

    doc.build(story)
    buffer.seek(0)
    return buffer


def build_routine_table(days, schedule, time_slots, stream_name, cell_style, header_style):
    data = [[
        Paragraph("DAY/TIME", header_style),
        Paragraph("STREAM", header_style),
        *[Paragraph(pdf_text(slot), header_style) for slot in time_slots],
    ]]

    spans = []

    for row_index, day in enumerate(days, start=1):
        row, row_spans = build_routine_row(
            row_index,
            day,
            schedule.get(day, {}),
            time_slots,
            stream_name,
            cell_style,
            header_style,
        )
        data.append(row)
        spans.extend(row_spans)

    table = Table(
        data,
        colWidths=[0.55 * inch, 0.82 * inch] + [0.98 * inch] * len(time_slots),
        rowHeights=[0.42 * inch] + [0.88 * inch] * len(days),
        repeatRows=1,
    )
    table.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.75, colors.black),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f2f2f2")),
        ("BACKGROUND", (0, 1), (1, -1), colors.HexColor("#f8f8f8")),
        ("BACKGROUND", (6, 1), (6, -1), colors.HexColor("#f2f2f2")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("FONTSIZE", (0, 0), (-1, -1), 6.5),
        ("LEADING", (0, 0), (-1, -1), 7.4),
        *spans,
    ]))
    return table


def build_routine_row(row_index, day, day_schedule, time_slots, stream_name, cell_style, header_style):
    row = [
        Paragraph("<br/>".join(pdf_text(day.upper())), header_style),
        Paragraph(pdf_text(stream_name or "Selected Stream"), cell_style),
    ]
    spans = []
    run_start = None
    run_teacher_id = None
    run_text = ""

    def finish_run(last_index):
        nonlocal run_start, run_teacher_id, run_text
        if run_start is None:
            return

        row[run_start + 2] = Paragraph(run_text, cell_style)
        if last_index > run_start:
            spans.append(("SPAN", (run_start + 2, row_index), (last_index + 2, row_index)))

        run_start = None
        run_teacher_id = None
        run_text = ""

    for index, slot in enumerate(time_slots):
        if index == 4:
            row.append(Paragraph("R<br/>E<br/>C<br/>E<br/>S<br/>S", header_style))
            finish_run(index - 1)
            continue

        entry = day_schedule.get(slot, {})
        teacher_id = entry.get("teacherId")
        subject = entry.get("subject") or ""
        teacher = entry.get("teacher") or ""
        text = "<br/>".join(pdf_text(part) for part in [subject, teacher] if part) or "-"
        row.append(Paragraph(text, cell_style))

        if not teacher_id:
            finish_run(index - 1)
            continue

        if teacher_id != run_teacher_id:
            finish_run(index - 1)
            run_start = index
            run_teacher_id = teacher_id
            run_text = text

    finish_run(len(time_slots) - 1)
    return row, spans


def pdf_text(value):
    return escape(str(value))


def get_timetable(name, dept_id, batch_id):
    if not dept_id or not batch_id:
        return None

    return db.session.execute(
        db.select(Timetable).where(
            Timetable.name == name,
            Timetable.dept_id == dept_id,
            Timetable.batch_id == batch_id,
        )
    ).scalar_one_or_none()


def get_or_create_timetable(name, dept_id, batch_id):
    timetable = get_timetable(name, dept_id, batch_id)
    if timetable:
        return timetable

    timetable = Timetable(name=name, dept_id=dept_id, batch_id=batch_id)
    db.session.add(timetable)
    db.session.flush()
    return timetable


def get_or_create_timeslot(day, slot_label, day_index, slot_index):
    start_time, end_time = split_slot_label(slot_label)
    timeslot = db.session.execute(
        db.select(Timeslot).where(
            Timeslot.day == day,
            Timeslot.start_time == start_time,
            Timeslot.end_time == end_time,
        )
    ).scalar_one_or_none()
    if timeslot:
        return timeslot

    slot_order = day_index * 100 + slot_index
    while db.session.execute(db.select(Timeslot).where(Timeslot.slot_order == slot_order)).scalar_one_or_none():
        slot_order += 1000

    timeslot = Timeslot(day=day, start_time=start_time, end_time=end_time, slot_order=slot_order)
    db.session.add(timeslot)
    db.session.flush()
    return timeslot


def split_slot_label(slot_label):
    parts = str(slot_label).split("-", 1)
    if len(parts) != 2:
        return str(slot_label), ""
    return parts[0], parts[1]


def slot_label(timeslot):
    return f"{timeslot.start_time}-{timeslot.end_time}"


def count_teacher_assignments(teacher_id):
    return db.session.execute(
        db.select(db.func.count(TeacherAssignment.assignment_id)).where(
            TeacherAssignment.teacher_id == teacher_id
        )
    ).scalar() or 0


def teacher_assignment_labels(teacher_id, current_assignment_id):
    assignments = db.session.execute(
        db.select(TeacherAssignment).where(
            TeacherAssignment.teacher_id == teacher_id,
            TeacherAssignment.assignment_id != current_assignment_id,
        )
    ).scalars().all()

    return [
        f"{assignment.department.name} / {assignment.batch.name} / {assignment.subject.name}"
        for assignment in assignments
    ]


def load_saved_schedule(timetable):
    if not timetable:
        return {}

    rows = timetable_entry_rows(
        db.select(TimeTableEntry, Timeslot, TeacherAssignment, Subject, Teacher)
        .join(Timeslot, TimeTableEntry.timeslot_id == Timeslot.timeslot_id)
        .join(TeacherAssignment, TimeTableEntry.ta_id == TeacherAssignment.assignment_id)
        .join(Subject, TeacherAssignment.subject_id == Subject.subject_id)
        .join(Teacher, TeacherAssignment.teacher_id == Teacher.teacher_id)
        .where(TimeTableEntry.timetable_id == timetable.timetable_id)
    )

    schedule = {}
    for entry, timeslot, assignment, subject, teacher in rows:
        schedule.setdefault(timeslot.day, {})[slot_label(timeslot)] = {
            "assignmentId": assignment.assignment_id,
            "teacherId": teacher.teacher_id,
            "subjectId": subject.subject_id,
            "teacher": teacher.name,
            "subject": subject.name,
            "stream": "",
        }
    return schedule


def load_teacher_conflicts(timetable_name, current_timetable):
    current_timetable_id = current_timetable.timetable_id if current_timetable else None
    query = (
        db.select(TimeTableEntry, Timeslot, TeacherAssignment, Timetable, Department, Batch, Subject, Teacher)
        .join(Timeslot, TimeTableEntry.timeslot_id == Timeslot.timeslot_id)
        .join(TeacherAssignment, TimeTableEntry.ta_id == TeacherAssignment.assignment_id)
        .join(Timetable, TimeTableEntry.timetable_id == Timetable.timetable_id)
        .join(Department, Timetable.dept_id == Department.dept_id)
        .join(Batch, Timetable.batch_id == Batch.batch_id)
        .join(Subject, TeacherAssignment.subject_id == Subject.subject_id)
        .join(Teacher, TeacherAssignment.teacher_id == Teacher.teacher_id)
        .where(Timetable.name == timetable_name)
    )
    if current_timetable_id:
        query = query.where(Timetable.timetable_id != current_timetable_id)

    conflicts = {}
    for _, timeslot, assignment, _, department, batch, subject, teacher in timetable_entry_rows(query):
        teacher_slots = conflicts.setdefault(str(assignment.teacher_id), {})
        teacher_slots.setdefault(f"{timeslot.day}|{slot_label(timeslot)}", []).append({
            "teacher": teacher.name,
            "department": department.name,
            "batch": batch.name,
            "subject": subject.name,
        })
    return conflicts


def find_save_conflicts(schedule, days, time_slots, timetable, timetable_name):
    conflicts = []
    saved_conflicts = load_teacher_conflicts(timetable_name, timetable)

    for day in days:
        for slot in time_slots:
            entry = schedule.get(day, {}).get(slot, {})
            teacher_id = entry.get("teacherId")
            if not teacher_id:
                continue

            conflict_items = saved_conflicts.get(str(teacher_id), {}).get(f"{day}|{slot}", [])
            for conflict in conflict_items:
                conflicts.append({
                    "day": day,
                    "timeSlot": slot,
                    "teacherId": teacher_id,
                    "teacher": entry.get("teacher") or conflict["teacher"],
                    "subject": entry.get("subject") or "",
                    "with": conflict,
                })

    return conflicts


def timetable_entry_rows(query):
    return db.session.execute(query).all()

# @editor_bp.route("/api/teacher_data")
# def get_teacher_data():
#     return jsonify(cards_json)
