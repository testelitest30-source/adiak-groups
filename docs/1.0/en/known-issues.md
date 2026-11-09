# Known issues (ADIAK 1.0 → next update)

Found during the owner's test of the signed ADIAK 1.0 APK on a Samsung Galaxy S25 (2026-11-09).
Non-critical: they do not block the 1.0 release and are scheduled for the next update (1.0.1).

| # | Issue | Impact | Plan |
|---|---|---|---|
| 1 | **Admin/student count** — lists and statistics count admins as students (or the reverse), so the numbers do not match the real number of students. | Teachers and admins see wrong totals. | Count only non-admin profiles with `role = 'student'`; show admins/teachers separately. |
| 2 | **Admin names missing in group lists** — an admin account's name is blank or missing in group member lists. | Unclear who is in the group. | Group member lists show every member's name with a role badge. |
| 3 | **Confusing placement of new features** — entry points to the Presentation Center, Teacher Studio, Class Hub and notifications are not obvious enough. | New users struggle to find the features. | Clear entry points on the home screen and in the menu, plus short first-use hints. |

Each issue is also tracked as a GitHub issue.
