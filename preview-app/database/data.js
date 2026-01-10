const DATA = {
  serialMapping: {
    LP3: { min: "EV0000-20250000" },
    LP1: { min: "EV0000-20240000", max: "EV0000-20249999" },
    SOM: { max: "EV0000-20239999" }
  },
  steps: [
    {
      id: "setup.identify-model",
      title: "Identify model and variant",
      summary: "Scan or enter the serial to auto-route the flow.",
      actions: [
        "Scan serial using the app or enter manually",
        "Resolve model based on serial mapping",
        "Confirm model badge"
      ],
      details: [
        "Scan the serial with the scanner app or enter it manually.",
        "Map the serial to the correct model (SOM, LP1, or LP3).",
        "Confirm the model badge before continuing."
      ]
    },
    {
      id: "setup.unbox-assemble",
      title: "Unbox and assemble",
      summary: "Unbox, assemble, and position the kiosk.",
      actions: ["Confirm included items", "Assemble per guide", "Position near power and internet"],
      details: [
        "Complete the initial assembly before powering on the kiosk.",
        "Verify all included items and cables are present.",
        "Position the kiosk near power and a stable internet connection."
      ]
    },
    {
      id: "setup.power-control-panel",
      title: "Boot to Control Panel",
      summary: "Power on and reach Control Panel.",
      actions: ["Power on using rear switch", "Tap Evolt logo if login screen appears"],
      details: [
        "Power on the kiosk using the rear switch.",
        "If the Control Panel appears, continue to the next step.",
        "If the main login screen appears, tap the Evolt360 logo (top-left) to open Control Panel."
      ]
    },
    {
      id: "setup.connect-internet",
      title: "Connect to internet",
      summary: "Ethernet preferred, Wi-Fi fallback.",
      actions: [
        "Ethernet: plug in and press Refresh",
        "Wi-Fi: USB dongle -> Network -> Wi-Fi ON -> New Connection",
        "Confirm Online status is green"
      ],
      details: [
        "Ethernet: plug in the cable, then press Refresh on the Control Panel.",
        "Confirm Offline turns green and Network API Status shows connected.",
        "Wi-Fi: plug the USB dongle into USB port 1, open Network, and toggle Wi-Fi ON.",
        "Tap New Connection, select the network, enter the password, and connect.",
        "Return to Control Panel, press Refresh, and confirm Online is green.",
        "If still offline, try a mobile hotspot or USB tether and review firewall rules."
      ]
    },
    {
      id: "setup.software-update",
      title: "Run software update",
      summary: "Update system after connecting.",
      actions: ["Control Panel -> Software Update", "Wait for reboot"],
      details: [
        "On Control Panel, select Software Update.",
        "Download and install the latest software (can take up to 30 minutes).",
        "After the reboot, return to the Control Panel to continue."
      ]
    },
    {
      id: "setup.operator-panel",
      title: "Operator Panel login",
      summary: "Use sticker login and set defaults.",
      actions: ["Login from back sticker", "Set Kiosk Mode Unattended", "Save"],
      details: [
        "Use the username/password provided by Insights (contact support if missing).",
        "Control Panel -> Operator Panel, then sign in.",
        "Choose Attended or Unattended mode.",
        "Set printer option: Off, Auto, or Manual.",
        "Choose the volume setting, then return to Control Panel and press Refresh."
      ]
    },
    {
      id: "setup.printer",
      title: "Printer setup",
      summary: "Connect and set default printer.",
      actions: ["Add printer", "Select correct driver", "Set Server Default"],
      details: [
        "Tap the Evolt logo to access the Control Panel.",
        "Select Printers, then click Add Printer.",
        "Choose your Brother printer, click Continue, wait 5 seconds, then click Continue again.",
        "Select the driver: Brother HL-L2300D using brlaser v4 (en), then click Add Printer.",
        "Click Set Default Options and wait for the message to disappear.",
        "Click Set As Server Default and confirm.",
        "Click Back to Evolt Control Panel, press Refresh, then Start Scanning."
      ]
    },
    {
      id: "setup.calibration",
      title: "Scale check",
      summary: "Calibrate for accurate readings.",
      actions: ["Control Panel -> Scale", "Calibrate and Save", "Test Weight Only"],
      details: [
        "On Control Panel, open Scale.",
        "Run calibration and save the results.",
        "Use Test Weight Only to confirm readings."
      ]
    },
    {
      id: "setup.first-scan",
      title: "First scan test",
      summary: "Run and print a test scan.",
      actions: ["Start Scanning", "Run test scan", "Confirm print preview"],
      details: [
        "Confirm the red Ready to Scan button appears on Control Panel.",
        "Press Ready to Scan to return to the main scan menu.",
        "Run a test scan and confirm the print preview if a printer is connected."
      ]
    }
  ],
  troubleshooting: [
    {
      id: "issue.no-internet",
      title: "Cannot connect to internet",
      steps: ["Control Panel -> Network", "Check Ethernet or Wi-Fi", "Confirm Online status"]
    },
    {
      id: "issue.white-screen",
      title: "White screen",
      steps: ["Restart kiosk", "Reconnect internet", "Run software update"]
    },
    {
      id: "issue.no-new-connection",
      title: "No New Connection option",
      steps: ["Check USB dongle", "System -> Lock USB OFF", "Power cycle"]
    },
    {
      id: "issue.no-start-button",
      title: "No Start Scanning button",
      steps: ["Power cycle", "Check Scale API Ready", "Login to Operator Panel"]
    },
    {
      id: "issue.print-missing",
      title: "No print button or preview",
      steps: ["Run software update", "Check print mode", "Verify default printer"]
    },
    {
      id: "issue.print-misaligned",
      title: "Prints misaligned",
      steps: ["Prefer wired USB", "Delete and re-add printer", "Adjust print position"]
    }
  ],
  chatbot: [
    {
      q: "How do I connect the kiosk to Wi-Fi?",
      a: "Insert the USB Wi-Fi dongle into USB port 1. In Control Panel select Network, turn Wi-Fi ON, tap New Connection, choose the network, enter the password, then press Refresh. Confirm Online status is green."
    },
    {
      q: "How do I run a software update?",
      a: "From Control Panel, confirm Online status is green, then press Software Update. The update runs automatically and takes about 3-4 minutes, then the kiosk reboots."
    },
    {
      q: "Where do I find the Operator Panel login?",
      a: "It is on the black sticker on the back of the scanner. If missing, contact support."
    },
    {
      q: "The scanner is stuck on a white screen. How do I fix it?",
      a: "Restart the kiosk, reconnect to the internet, and run a software update. If the screen stays white, wait 10 minutes for recovery. Escalate to support if it does not recover."
    },
    {
      q: "What are the hardware variants?",
      a: "SOM has a fan, LP3 is the newest manufactured in 2025, and LP1 is the other variant."
    }
  ]
};
