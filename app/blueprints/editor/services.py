import datetime


def week():
    # Get today's date
    today = datetime.date.today()

    # Calculate first day (Monday) and last day (Sunday)
    first_day = today - datetime.timedelta(days=today.weekday())
    last_day = first_day + datetime.timedelta(days=6)

    return f"{first_day} - {last_day}"
    
