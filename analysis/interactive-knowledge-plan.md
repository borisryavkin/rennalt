# Interactive Knowledge App Plan (Web + Mobile)

## Goals
- Replace static PDFs with guided, model-specific setup and troubleshooting flows.
- Use serial scan to route users to the right model/variant and steps.
- Provide an offline-first experience for setup and common fixes.
- Reduce support tickets and time-to-first-scan.

## Platforms
- Web (public, PWA offline cache for critical flows)
- Mobile (offline-first, sync when online)

## Machines / Variants
- SOM (fan present)
- LP1 (neither newest nor the SOM fan variant)
- LP3 (newest, manufactured in 2025)
- Serial format in new standard: EV...-YYYYMMDD
- Serial mapping (from provided model numbers):
  - LP3: EV0000-20250000 and above
  - LP1: EV0000-20240000 to EV0000-20249999
  - SOM: below EV0000-20240000

## Information Architecture
- Home
  - Scan serial (primary)
  - Browse models (SOM, LP1, LP3)
  - Ask a question (chatbot)
- Guided Setup
  - Model-specific steps
  - Inline checks and pass/fail confirmation
- Knowledge Base
  - Troubleshooting cards
  - FAQs
- Support
  - Escalate with serial + TeamViewer ID

## Core Flows
1) Scan serial -> identify model/variant -> start guided setup
2) Browse model -> start guided setup
3) Ask -> answer + link to exact step or fix

## Content Model (Interactive Cards)
- Setup Step
  - Goal, prerequisites, action, confirm, common errors, media
- Troubleshooting Card
  - Symptom, cause, fix, verification, escalation
- Safety / Notes
  - Reusable callouts (data security, internet requirement)
- Parts / Tools
  - Cable, Wi-Fi dongle, printer, etc.

## Source Content Inventory (Extracted)
### Quick Start Guide (legacy)
- Getting Started (boot screens)
- Get Connected (Ethernet / Wi-Fi)
- Get Up to Date (software update)
- Signing Up (credentials, login)
- Setting up a printer
- Ready to go
- Firewall Configuration Guidance

### Self Help Guide (legacy)
- Connecting to the internet
- Software update
- White screen
- No New Connection option
- Cannot find customer details
- Frozen kiosk screen
- Scan did not complete
- Cannot print or access Wi-Fi
- Weight not showing correctly
- Connection to the internet lost
- Red start scanning button not there
- Relogging requirement

### New Standard PDFs
- Quick-start.a4
  - Hardware variants (SOM/LP1/LP3)
  - Getting started -> Get connected -> Update -> Login -> Printer
- Self-help.a4
  - Condensed troubleshooting steps with escalation guidance

### Online Knowledge Base (relevant categories + articles)
Installation & Assembly
- Connect the Printer to the Evolt 360 Body Scanner
- Results are not aligned on the sheets when printed
- Disabling Deep Sleep on the Printer
- No 'Print' button or option to 'Preview' after a scan
- Printer Jamming
- Compatible Printers
- How to connect the Evolt 360 Scanner to an HP M203W Printer
- Connecting the Scanner to the Brother Printer via Wi-Fi
- Setting up your Evolt 360 Scanner
- How to unpack your Evolt 360 Scanner?
- How to setup your Evolt 360 Scanner?
- How to pack & transport your Evolt 360 Scanner?
- Evolt 360 Scanner Housekeeping
- Age of Consent/ Data Protection for Minors

Connection & Software Updates
- Calibrating Scanner
- Connecting the Evolt 360 Body Scanner to the internet
- Enable a Passcode System for your Evolt 360 Body Scanner
- Software Update
- The scanner is stuck on the Control Panel screen
- No option to add 'NEW CONNECTION'
- No 'Start Scanning' button
- Nothing happens when you tap on Log In/ Sign Up for scan
- Scanner is not turning ON
- Scanner is stuck on a white screen
- What is my Operator Panel log in?

## Guided Setup (MVP Step List)
1) Identify kiosk (scan serial or select model)
2) Boot to Control Panel
3) Connect to internet (Ethernet preferred; Wi-Fi fallback)
4) Verify Online + Network API status
5) Run software update
6) Login to kiosk / operator panel
7) Configure printer (if required)
8) Confirm ready to scan

## Troubleshooting Cards (MVP)
- Internet connection (no online status / network API)
- White screen
- No new Wi-Fi connection option
- Frozen kiosk screen
- Scan did not complete
- Cannot print or access Wi-Fi (USB lock)
- Weight not showing correctly (scale settings + calibrate)
- Red start scanning button missing
- Relogging requirement

## Offline Strategy
- Preload: setup steps + top 30 issues per model
- Cache media assets at low-res for offline
- Sync logs and analytics when online

## Chatbot (New Build)
- RAG over curated content (setup steps + troubleshooting cards)
- Answers link to exact step or fix
- Escalation prompts require serial + TeamViewer ID

## Analytics (Minimum)
- Setup start/end, step completion, step fail
- Most searched topics
- Top chatbot queries and deflection rate
- Scan model distribution (SOM/LP1/LP3)

## Open Questions
- Do we need region-specific firewall whitelists in-app?
- Printer models supported and setup paths?
- Do we require operator authentication or is it fully public?
