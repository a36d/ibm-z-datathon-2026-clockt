"""
Clockt activity analysis and dashboard statistics.
"""

from dataclasses import dataclass
from datetime import datetime
from collections import Counter, defaultdict


@dataclass
class Activity:
    timestamp: datetime
    application: str
    action: str
    duration_seconds: float


def find_repeated_activities(activities: list[Activity]):
    counts = Counter(
        (activity.application, activity.action)
        for activity in activities
    )

    return [
        {
            "application": application,
            "action": action,
            "repetitions": count,
            "total_seconds": sum(
                activity.duration_seconds
                for activity in activities
                if activity.application == application
                and activity.action == action
            ),
        }
        for (application, action), count in counts.items()
        if count >= 2
    ]


def generate_suggestions(repeated_activities):
    suggestions = []

    for activity in repeated_activities:
        application = activity["application"]
        action = activity["action"]
        repetitions = activity["repetitions"]
        total_seconds = activity["total_seconds"]

        if application == "Excel" and action == "Copy data":
            recommendation = (
                "Consider using Excel formulas, Power Query, "
                "or a macro to automate repeated data copying."
            )
        elif application == "Outlook" and action == "Send email":
            recommendation = (
                "Consider using Outlook email templates "
                "or Quick Parts for repetitive messages."
            )
        else:
            recommendation = (
                "Consider using a shortcut, template, or automation "
                "to reduce repetitive work."
            )

        if repetitions >= 2:
            suggestions.append({
                "application": application,
                "action": action,
                "repetitions": repetitions,
                "total_seconds": total_seconds,
                "suggestion": (
                    f"You performed '{action}' in {application} "
                    f"{repetitions} times, spending {total_seconds} seconds. "
                    + recommendation
                ),
            })

    return suggestions


def calculate_activity_statistics(activities):
    """
    Calculate dashboard statistics from saved activity records.

    Accepts dictionaries returned by database.get_activities().
    """

    application_stats = defaultdict(
        lambda: {
            "activity_count": 0,
            "total_duration_seconds": 0.0,
        }
    )

    total_duration = 0.0

    for activity in activities:
        application = activity["application"]
        duration = float(activity["duration_seconds"])

        total_duration += duration

        application_stats[application]["activity_count"] += 1
        application_stats[application]["total_duration_seconds"] += duration

    applications = [
        {
            "application": application,
            "activity_count": stats["activity_count"],
            "total_duration_seconds": round(
                stats["total_duration_seconds"], 2
            ),
        }
        for application, stats in application_stats.items()
    ]

    applications.sort(
        key=lambda item: (
            -item["total_duration_seconds"],
            item["application"],
        )
    )

    return {
        "total_activities": len(activities),
        "total_duration_seconds": round(total_duration, 2),
        "unique_applications": len(applications),
        "applications": applications,
    }


if __name__ == "__main__":
    sample_activities = [
        Activity(datetime.now(), "Excel", "Copy data", 30),
        Activity(datetime.now(), "Chrome", "Search documentation", 45),
        Activity(datetime.now(), "Excel", "Copy data", 25),
        Activity(datetime.now(), "Excel", "Copy data", 35),
        Activity(datetime.now(), "Outlook", "Send email", 60),
        Activity(datetime.now(), "Outlook", "Send email", 50),
    ]

    repeated = find_repeated_activities(sample_activities)
    suggestions = generate_suggestions(repeated)

    for suggestion in suggestions:
        print(suggestion["suggestion"])