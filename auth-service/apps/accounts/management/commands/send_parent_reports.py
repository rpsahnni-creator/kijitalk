"""Weekly progress email to parents of under-18 learners who gave consent.

Run once a week from a scheduler, e.g. Sunday 6 pm IST:
    python manage.py send_parent_reports
"""

import logging

import requests
from django.conf import settings
from django.core.management.base import BaseCommand

from apps.accounts.emails import _send
from apps.accounts.models import User

logger = logging.getLogger(__name__)


def build_report(learner, data: dict) -> str:
    lines = [
        "Namaste!",
        "",
        f"{learner.display_name} ki pichle 7 din ki KijiTalk report:",
        "",
        f"• Practice: {data.get('minutes', 0)} minute, {data.get('activeDays', 0)} din",
        f"• Lessons complete: {data.get('lessonsCompleted', 0)}",
        f"• Streak: {data.get('streak', 0)} din",
    ]
    if data.get("avgScore") is not None:
        lines.append(f"• Average score: {data['avgScore']}%")
    corrections = data.get("recentCorrections") or []
    if corrections:
        lines += ["", "Is hafte inhone yeh sudhaara:"]
        lines += [f'  "{c["original"]}" → "{c["corrected"]}"' for c in corrections]
    if not data.get("minutes"):
        lines += ["", "Is hafte practice nahi hui — roz 10 minute bhi bahut fark laata hai. Unhe thoda encourage karo! 🙂"]
    lines += [
        "",
        f"Permission ya data se jude sawal: {settings.FRONTEND_URL}/privacy",
        "",
        "— Team KijiTalk",
    ]
    return "\n".join(lines)


class Command(BaseCommand):
    help = "Email the weekly progress report to parents who consented."

    def handle(self, *args, **options):
        if not settings.INTERNAL_API_KEY:
            self.stderr.write("INTERNAL_API_KEY is not set; cannot read progress from the Node API.")
            return

        learners = User.objects.filter(
            is_active=True, is_minor=True, parental_consent=User.CONSENT_GRANTED
        ).exclude(parent_email="")
        sent = 0
        for learner in learners:
            try:
                res = requests.get(
                    f"{settings.NODE_API_URL}/internal/reports/weekly",
                    params={"email": learner.email},
                    headers={"X-Internal-Key": settings.INTERNAL_API_KEY},
                    timeout=15,
                )
                if res.status_code == 404:
                    continue
                res.raise_for_status()
            except requests.RequestException:
                logger.exception("Weekly report skipped for account %s", learner.pk)
                continue
            _send(f"KijiTalk — {learner.display_name} ki weekly report", build_report(learner, res.json()), learner.parent_email)
            sent += 1
        self.stdout.write(self.style.SUCCESS(f"Parent reports sent: {sent}"))
