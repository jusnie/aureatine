# Aureatine design

Palette (user-supplied, from the brown reference image):
- Base surface: #EDE0D4
- Sand: #E6CCB2
- Latte: #DDB892
- Taupe: #B08968
- Caramel: #9C6644
- Cocoa: #7F5539
- Ink (body text): #4A2F20, muted text #6B4A38

Status colors (the only colors outside the brown palette):
- Success messages: green #2F7D4F
- Error messages: red #B3261E

Style: neumorphism. Every raised card, panel, and button sits on the base color with a soft light shadow from the top-left and a soft brown shadow to the bottom-right. Inputs are pressed in with an inset shadow. Primary actions are cocoa fill with white text and press in on tap. Glass blur is removed.

Contrast: body text (#4A2F20) on base (#EDE0D4) is above 7:1. White text on cocoa and caramel panels is used for every label on a dark fill.

Implementation: colors converted by role in the existing stylesheets. `src/theme.css` (renamed from `glass.css`) loads last in `src/main.jsx` and holds the tokens (`--base`, `--ink`, `--cocoa`, `--sh-out`, `--sh-in`, `--sh-press`, `--success`, `--error`). The QR code keeps its dark-on-light colors (#241d17 on #ffffff) so it scans reliably. The share card keeps its black bottom gradient, and only its red glow became caramel.

Skill guidance applied: impeccable craft floor (contrast, visible focus rings, themed selection, motion on transform and opacity only), taste-skill neumorphism rules (one light source, soft low-contrast shadows, pressed states), and aislop quality gate (92 healthy, 0 errors).

Open layout item: on `/leaderboard` at 390px, the motion toggle and AI launcher can overlap the bottom of the leaderboard list. Fix by layout (spacing above the fixed controls), not by styling the controls.
