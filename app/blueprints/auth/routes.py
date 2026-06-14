from . import auth_bp
from flask import render_template, request, redirect, url_for, flash
from werkzeug.exceptions import BadRequest
from app.extensions import db
from app.models import User
from flask_login import login_user, logout_user, login_required, current_user


@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        if not username or not password:
            flash("Username and password required", "error")
            raise BadRequest()
        existing = db.session.execute(db.select(User).where(User.username == username)).scalar()
        if existing:
            flash("Username already taken", "error")
            return redirect(url_for("auth.register"))

        user = User(username=username)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        login_user(user)
        flash("Registered and logged in", "success")
        return redirect(url_for("landing_after.index"))

    return render_template("register.html")


@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        user = db.session.execute(db.select(User).where(User.username == username)).scalar()
        if not user or not user.check_password(password):
            flash("Invalid username or password", "error")
            return redirect(url_for("auth.login"))
        login_user(user)
        flash("Logged in", "success")
        return redirect(url_for("landing_after.index"))

    return render_template("login.html")


@auth_bp.route("/logout")
@login_required
def logout():
    logout_user()
    flash("Logged out", "info")
    return redirect(url_for("landing page.home"))
