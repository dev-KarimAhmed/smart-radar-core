# **App Name**: RadaR Syndication Platform

## Core Features:

- Driver State Engine: Manages driver availability and state transitions (active, idle, busy) including warnings, automatic logouts, and persistent state storage.
- Radar Matching Engine: Matches riders with nearby drivers based on location and displays a limited set (9 visible, 3 hidden) for riders and prioritizes requests for drivers within 2.5 km.
- Idleness Detection via Heartbeat: Monitors GPS movement and inactivity, triggering warnings and automatic dormancy status updates.
- Digital Handshake Orchestrator: Manages the request-acceptance process including notifying other drivers about a successful ride request, closing requests, revealing contact information, calculating an expiryTime (ETA + 10 min), and handling archival/cancellation logic.
- Reputation & Behavior Engine: Collects driver data, including acceptance, rejection, and ignore rates, feedback, and star ratings to generate metrics like Acceptance Rate and Vitality Index.
- Smart Broadcasting: LLM Tool to ensure that broadcasts and advertisements are efficiently displayed within a local region using AI-assisted relevance filtering to target users in specific regions or categories.

## Style Guidelines:

- Primary color: A calming yet reliable blue (#5DADE2) to invoke trust and efficiency in the matchmaking process.
- Background color: A very light, desaturated blue (#EBF4FA) to support a clean, uncluttered interface.
- Accent color: A muted violet (#A98DDE) to draw attention to important CTAs and enhance user navigation.
- Headline font: 'Space Grotesk', a sans-serif font, offering a modern and computerized feel for headlines and concise text elements.
- Body font: 'Inter', a grotesque-style sans-serif for its neutral, readable design in both headlines and body text.
- Use minimalist, clear icons that match the driving/location context, ensuring they're intuitive for quick recognition.
- Employ a clean, card-based layout for listing drivers or ride requests, optimizing readability and ease of interaction. Cards must use consistent presentation to build intuitive sense of what content is related.