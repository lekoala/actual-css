# Timeline

> Vertical history of dated events: activity feed, audit log, order tracking.

Use an `<ol>` of events, most recent first or oldest first. Each event gets a
dot on a rail; a direct `<time>` child is its dateline. The content is plain
HTML in block flow, so a sentence that mixes text and links stays one
sentence.

**Related terms:** activity feed, activity log, history, audit trail, event
log, changelog, order tracking.

For progress through a process (checkout, onboarding), use
[Steps](steps.md): a timeline records what happened, steps show where you
are. For a horizontal, alternating or time-scaled chronology, or a Gantt
chart, render a diagram: see [Diagrams](diagrams.md). For release notes with
the version beside the rail, see the
[Changelog template](../../demo/templates/changelog.html).

## Basic usage

```html demo
<ol class="timeline">
  <li>
    <time datetime="2026-10-18T09:30">Today, 09:30</time>
    <strong>Appointment confirmed</strong>
    <p class="muted">The patient received a confirmation email.</p>
  </li>
  <li>
    <time datetime="2026-10-17T14:00">Yesterday, 14:00</time>
    <strong>Appointment requested</strong>
    <p class="muted">The booking was submitted online.</p>
  </li>
  <li>
    <time datetime="2026-10-15">October 15</time>
    <strong>Patient registered</strong>
  </li>
</ol>
```

The dot centres on the first line box of the event, whether it opens with the
`<time>` or with text. Block children drop their margins; wrap the content in
a [`.stack`](../layout/stack.md) when an event needs more spacing.

## Intents

An intent class on the `<li>` colors its dot.

```html demo
<ol class="timeline">
  <li class="success">
    <time datetime="2026-10-18">October 18</time>
    Order delivered
  </li>
  <li class="warning">
    <time datetime="2026-10-17">October 17</time>
    Delivery delayed
  </li>
  <li class="primary">
    <time datetime="2026-10-16">October 16</time>
    Order shipped
  </li>
</ol>
```

The color is decoration: write the state in the text too.

## Avatars and icons

An [`.avatar`](avatar.md) or an `aria-hidden` icon written first in the `<li>`
replaces the dot. One such event widens the rail for the whole list, so dots
and slots stay aligned. An icon sits in a disc; the event's intent tints it
like a soft badge.

Dots, discs and avatars share the same alignment with the first line box.
For an off-centre icon, wrap the glyph in an `aria-hidden` slot and apply a
local `translate` to the inner glyph. Keep the disc in place:
`--timeline-marker-nudge` moves the whole marker and its rail geometry.

```html demo
<ol class="timeline">
  <li>
    <span class="avatar primary"><abbr>AM</abbr></span>
    <time datetime="2026-10-18T09:30">Today, 09:30</time>
    <a href="#">Ada Morgan</a> approved the security terms.
  </li>
  <li class="success">
    <i class="ti ti-check" aria-hidden="true"></i>
    <time datetime="2026-10-17">Yesterday</time>
    Contract signed
  </li>
  <li>
    <time datetime="2026-10-15">October 15</time>
    Account created
  </li>
</ol>
```

## Dates at the end

`.timeline-dates-end` moves each `<time>` to the end of the event's first
line, so the titles lead and the dates line up in a column on the right.
Write the `<time>` first in the event, as usual.

It suits a narrow container: a sidebar, a card, a side panel. In a wide
column the dates drift away from their titles; cap the list's width or keep
the default dateline.

```html demo
<section class="card" style="--card-max-inline-size: 28rem">
  <ol class="timeline timeline-dates-end">
    <li class="success">
      <i class="ti ti-check" aria-hidden="true"></i>
      <time datetime="2026-11-11T09:40">09:40</time>
      <strong>Results available</strong>
      <p class="muted">Reviewed by the attending physician.</p>
    </li>
    <li class="primary">
      <i class="ti ti-flask" aria-hidden="true"></i>
      <time datetime="2026-11-11T08:15">08:15</time>
      <strong>Sample sent to the lab</strong>
    </li>
    <li>
      <i class="ti ti-message" aria-hidden="true"></i>
      <time datetime="2026-11-10">Yesterday</time>
      <strong>Patient asked a question</strong>
      <p class="muted">Should I fast before the blood test?</p>
    </li>
    <li>
      <i class="ti ti-calendar-plus" aria-hidden="true"></i>
      <time datetime="2026-11-03">Nov 3</time>
      <strong>Appointment booked</strong>
    </li>
  </ol>
</section>
```

### In progress

For an event still running (an import, a sync, an upload), put a
[`.spinner`](spinner.md) inside the icon slot. The disc stays still and the
spinner takes the event's intent. A bare `.spinner` as the slot would lose its
own border to the disc's. Say the state in the text, since the slot is hidden
from assistive technology.

```html demo
<section class="card" style="--card-max-inline-size: 28rem">
  <ol class="timeline timeline-dates-end">
    <li class="warning">
      <span aria-hidden="true"><span class="spinner"></span></span>
      <time datetime="2026-11-11T10:00">Just now</time>
      <strong>Importing</strong> <code>batch-118</code>
      <p class="muted">Patient records from the March export</p>
    </li>
    <li class="success">
      <i class="ti ti-check" aria-hidden="true"></i>
      <time datetime="2026-11-11T09:40">20 min ago</time>
      <strong>Imported</strong> <code>batch-117</code>
      <p class="muted">Invoices for the second quarter</p>
    </li>
    <li class="danger">
      <i class="ti ti-x" aria-hidden="true"></i>
      <time datetime="2026-11-11T08:00">2 h ago</time>
      <strong>Failed</strong> <code>batch-116</code>
      <p class="muted">Lab results, 3 files · <a href="#">Open the error report</a></p>
    </li>
  </ol>
</section>
```

## Activity feed

Avatars as markers, the actor and verb as one sentence, and richer content
below: a [`.chat-bubble`](chat.md) for a comment, a [`.badge`](badge.md) for
a status, a [`.btn`](button.md) for a file. A [`.stack`](../layout/stack.md)
spaces the sentence from what follows; the `<time>` stays a direct child of
the `<li>`.

```html demo
<section class="card" style="--card-max-inline-size: 28rem">
  <ol class="timeline timeline-dates-end">
    <li>
      <span class="avatar primary"><abbr>NK</abbr></span>
      <time datetime="2026-11-11T09:55">5 min ago</time>
      <div class="stack">
        <p><a href="#">Noah Keller</a> <span class="muted">commented</span></p>
        <p class="chat-bubble">Could we move the follow-up to Thursday morning?</p>
      </div>
    </li>
    <li>
      <span class="avatar"><abbr>IR</abbr></span>
      <time datetime="2026-11-11T09:20">40 min ago</time>
      <a href="#">Inès Roy</a> <span class="muted">set the status to</span>
      <span class="badge soft primary">Confirmed</span>
    </li>
    <li>
      <span class="avatar"><abbr>TB</abbr></span>
      <time datetime="2026-11-11T08:00">2 h ago</time>
      <div class="stack">
        <p><a href="#">Tom Becker</a> <span class="muted">attached a file</span></p>
        <p>
          <a class="btn surface sm" href="#">
            <i class="ti ti-file" aria-hidden="true"></i>
            intake-form.pdf <span class="muted">180 KB</span>
          </a>
        </p>
      </div>
    </li>
    <li>
      <span class="avatar"><abbr>CL</abbr></span>
      <time datetime="2026-11-09">Monday</time>
      <a href="#">Chloé Laurent</a> <span class="muted">opened the case</span>
    </li>
  </ol>
</section>
```

## Density

The gap between events follows the density context: `.compact` and
`.spacious` on the list or an ancestor tighten or loosen it.

```html demo
<ol class="timeline compact">
  <li><time datetime="2026-10-18">Today</time>Build passed</li>
  <li><time datetime="2026-10-17">Yesterday</time>Build failed</li>
  <li><time datetime="2026-10-16">October 16</time>Build passed</li>
</ol>
```

## Hooks

- `--timeline-dot-size` — dot diameter.
- `--timeline-slot-size` — avatar and icon diameter; the rail takes this width
  as soon as one event has a slot.
- `--timeline-glyph-size` — icon and spinner size in a slot; half the slot.
- `--timeline-gap` — space between events; follows `--density-space`.
- `--timeline-inline-gap` — space between the rail and the content.
- `--timeline-line-size` — rail line thickness.
- `--timeline-marker-nudge` — correction to the whole marker's centring on the
  first line box; an `em` resolves against the event's text size.
