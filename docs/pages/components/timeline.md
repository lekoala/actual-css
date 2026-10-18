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
chart, use a diagram library.

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

The dot lines up with the first line of the event, whether it opens with the
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
and slots stay aligned. An icon sits in a disc colored by the event's intent.

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
- `--timeline-gap` — space between events; follows `--density-space`.
- `--timeline-inline-gap` — space between the rail and the content.
- `--timeline-line-size` — rail line thickness.
