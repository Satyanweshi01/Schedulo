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
        "batch_name": card.batch.name
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
    )


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

# @editor_bp.route("/api/teacher_data")
# def get_teacher_data():
#     return jsonify(cards_json)
