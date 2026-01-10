import SwiftUI

struct SetupStep: Identifiable {
    let id: String
    let title: String
    let summary: String
    let actions: [String]
}

struct IssueCard: Identifiable {
    let id: String
    let title: String
    let steps: [String]
}

struct ChatItem: Identifiable {
    let id = UUID()
    let q: String
    let a: String
}

struct ContentView: View {
    @State private var serial = ""
    @State private var model = "Unknown"
    @State private var serialMessage = "Enter a serial to identify the model."
    @State private var completed: Set<String> = []
    @State private var issueQuery = ""
    @State private var openIssues: Set<String> = []
    @State private var chatInput = ""
    @State private var chatAnswer = "Ask a question to see an answer."
    @State private var typingIndex = 0
    @State private var typingTimer: Timer?
    @State private var viewWidth: CGFloat = UIScreen.main.bounds.width
    @State private var showScanner = false

    private let steps: [SetupStep] = [
        SetupStep(id: "setup.identify-model", title: "Identify model and variant", summary: "Scan or enter the serial to auto-route the flow.", actions: ["Scan serial or enter manually", "Resolve model from serial mapping", "Confirm model badge"]),
        SetupStep(id: "setup.unbox-assemble", title: "Unbox and assemble", summary: "Unbox, assemble, and position the kiosk.", actions: ["Confirm included items", "Assemble per guide", "Position near power"]),
        SetupStep(id: "setup.power-control-panel", title: "Boot to Control Panel", summary: "Power on and reach Control Panel.", actions: ["Power on using rear switch", "Tap Evolt logo if login screen appears"]),
        SetupStep(id: "setup.connect-internet", title: "Connect to internet", summary: "Ethernet preferred, Wi-Fi fallback.", actions: ["Ethernet: plug in and refresh", "Wi-Fi: USB dongle -> Network -> Wi-Fi ON -> New Connection", "Confirm Online status is green"]),
        SetupStep(id: "setup.software-update", title: "Run software update", summary: "Update system after connecting.", actions: ["Control Panel -> Software Update", "Wait for reboot"]),
        SetupStep(id: "setup.operator-panel", title: "Operator Panel login", summary: "Use sticker login and set defaults.", actions: ["Login from back sticker", "Set Kiosk Mode Unattended", "Save"]),
        SetupStep(id: "setup.printer", title: "Printer setup", summary: "Connect and set default printer.", actions: ["Add printer", "Select correct driver", "Set Server Default"]),
        SetupStep(id: "setup.calibration", title: "Scale check", summary: "Calibrate for accurate readings.", actions: ["Control Panel -> Scale", "Calibrate and Save", "Test Weight Only"]),
        SetupStep(id: "setup.first-scan", title: "First scan test", summary: "Run and print a test scan.", actions: ["Start Scanning", "Run test scan", "Confirm print preview"])
    ]

    private let issues: [IssueCard] = [
        IssueCard(id: "issue.no-internet", title: "Cannot connect to internet", steps: ["Control Panel -> Network", "Check Ethernet or Wi-Fi", "Confirm Online status"]),
        IssueCard(id: "issue.white-screen", title: "White screen", steps: ["Restart kiosk", "Reconnect internet", "Run software update"]),
        IssueCard(id: "issue.no-new-connection", title: "No New Connection option", steps: ["Check USB dongle", "System -> Lock USB OFF", "Power cycle"]),
        IssueCard(id: "issue.no-start-button", title: "No Start Scanning button", steps: ["Power cycle", "Check Scale API Ready", "Login to Operator Panel"]),
        IssueCard(id: "issue.print-missing", title: "No print button or preview", steps: ["Run software update", "Check print mode", "Verify default printer"]),
        IssueCard(id: "issue.print-misaligned", title: "Prints misaligned", steps: ["Prefer wired USB", "Delete and re-add printer", "Adjust print position"])
    ]

    private let chatbot: [ChatItem] = [
        ChatItem(q: "How do I connect the kiosk to Wi-Fi?", a: "Insert the USB Wi-Fi dongle into USB port 1. In Control Panel select Network, turn Wi-Fi ON, tap New Connection, choose the network, enter the password, then press Refresh. Confirm Online status is green."),
        ChatItem(q: "How do I run a software update?", a: "From Control Panel, confirm Online status is green, then press Software Update. The update runs automatically and takes about 3-4 minutes, then the kiosk reboots."),
        ChatItem(q: "Where do I find the Operator Panel login?", a: "It is on the black sticker on the back of the scanner. If missing, contact support."),
        ChatItem(q: "The scanner is stuck on a white screen. How do I fix it?", a: "Restart the kiosk, reconnect to the internet, and run a software update. If the screen stays white, wait 10 minutes for recovery. Escalate to support if it does not recover."),
        ChatItem(q: "What are the hardware variants?", a: "SOM has a fan, LP3 is the newest manufactured in 2025, and LP1 is the other variant.")
    ]

    private let serialRegex = try? NSRegularExpression(pattern: "EV[A-Z0-9]{3,}-[A-Z0-9]{3,}", options: [])

    private var filteredIssues: [IssueCard] {
        if issueQuery.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return issues
        }
        return issues.filter { $0.title.lowercased().contains(issueQuery.lowercased()) }
    }

    private var progress: Int {
        guard !steps.isEmpty else { return 0 }
        return Int((Double(completed.count) / Double(steps.count)) * 100)
    }

    var body: some View {
        ZStack {
            LinearGradient(colors: [Color(hex: "0b0d10"), Color(hex: "101317")], startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()

            ScrollView {
                let isWide = viewWidth > 900
                let isCompact = viewWidth < 430
                VStack(spacing: 24) {
                    headerSection(isWide: isWide, isCompact: isCompact)
                    setupSection
                    troubleshootingSection
                    chatbotSection
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 40)
                .background(
                    GeometryReader { proxy in
                        Color.clear
                            .onAppear { viewWidth = proxy.size.width }
                            .onChange(of: proxy.size.width) { viewWidth = $0 }
                    }
                )
            }
            .sheet(isPresented: $showScanner) {
                CameraScannerView(isPresented: $showScanner, scannedText: $serial)
            }
            .onChange(of: serial) { newValue in
                let upper = newValue.uppercased()
                if upper != serial { serial = upper }
                if matchesSerial(upper) {
                    handleScan()
                }
            }
        }
    }

    private func headerSection(isWide: Bool, isCompact: Bool) -> some View {
        VStack(alignment: .leading, spacing: 16) {
            if isWide {
                HStack(alignment: .top, spacing: 16) {
                    headerCopy
                    Spacer()
                    headerMedia(imageWidth: 320, imageHeight: 220, alignTrailing: true, isCompact: false)
                }
            } else {
                VStack(alignment: .leading, spacing: 16) {
                    headerCopyCompact
                    headerMedia(imageWidth: nil, imageHeight: isCompact ? 220 : 240, alignTrailing: false, isCompact: isCompact)
                }
            }
        }
    }

    private var headerCopy: some View {
        VStack(alignment: .leading, spacing: 12) {
            badge
            Text("Welcome to Evolt")
                .font(.caption.weight(.semibold))
                .foregroundStyle(Color(hex: "6ee8ff"))
                .textCase(.uppercase)
                .tracking(2)

            Text("Scan. Configure. Fix.\nAll in one guided flow.")
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(.white)

            Text("Serial-driven setup and troubleshooting for SOM, LP1, and LP3. Built to replace PDFs with step-by-step confidence.")
                .foregroundStyle(Color(hex: "9aa3ad"))
                .font(.subheadline)

            serialCard
        }
    }

    private var headerCopyCompact: some View {
        VStack(alignment: .leading, spacing: 12) {
            badge
            Text("Welcome to Evolt")
                .font(.caption.weight(.semibold))
                .foregroundStyle(Color(hex: "6ee8ff"))
                .textCase(.uppercase)
                .tracking(2)

            Text("Scan. Configure. Fix.\nAll in one guided flow.")
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(.white)

            Text("Serial-driven setup and troubleshooting for SOM, LP1, and LP3. Built to replace PDFs with step-by-step confidence.")
                .foregroundStyle(Color(hex: "9aa3ad"))
                .font(.footnote)

            serialCard
        }
    }

    private func headerMedia(imageWidth: CGFloat?, imageHeight: CGFloat, alignTrailing: Bool, isCompact: Bool) -> some View {
        VStack(alignment: alignTrailing ? .trailing : .leading, spacing: 16) {
            Image("Team")
                .resizable()
                .scaledToFill()
                .frame(maxWidth: imageWidth, minHeight: imageHeight, maxHeight: imageHeight)
                .clipped()
                .cornerRadius(24)
                .overlay(
                    RoundedRectangle(cornerRadius: 24)
                        .stroke(Color(hex: "6ee8ff").opacity(0.5), lineWidth: 2)
                )

            statusCard
                .frame(maxWidth: isCompact ? .infinity : nil)
        }
    }

    private var badge: some View {
        Text("Evolt 360 Interactive Guide")
            .font(.caption.weight(.semibold))
            .foregroundStyle(Color(hex: "6ee8ff"))
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color(hex: "6ee8ff").opacity(0.12))
            .clipShape(Capsule())
    }

    private var serialCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Serial number")
                .font(.caption)
                .foregroundStyle(Color(hex: "9aa3ad"))

            HStack {
                TextField("EV001693-20230", text: $serial)
                    .textInputAutocapitalization(.characters)
                    .padding(12)
                    .background(Color(hex: "1b1f24"))
                    .cornerRadius(12)
                    .foregroundStyle(.white)

                Button("Scan") {
                    showScanner = true
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(Color(hex: "6ee8ff"))
                .foregroundStyle(Color(hex: "0b0d10"))
                .cornerRadius(12)
            }

            Text(serialMessage)
                .font(.caption)
                .foregroundStyle(Color(hex: "9aa3ad"))
        }
        .padding(16)
        .background(Color(hex: "15181c"))
        .cornerRadius(16)
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.05), lineWidth: 1))
    }

    private var statusCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Setup Status")
                .font(.caption.weight(.semibold))
                .foregroundStyle(Color(hex: "9aa3ad"))
                .textCase(.uppercase)
                .tracking(1)

            ProgressView(value: Double(progress), total: 100)
                .tint(Color(hex: "4de2a4"))

            Text("\(progress)% complete")
                .font(.caption)
                .foregroundStyle(Color(hex: "9aa3ad"))

            HStack(spacing: 10) {
                statChip(label: "Model", value: model)
                statChip(label: "Steps", value: "\(steps.count)")
                statChip(label: "Offline", value: "Ready")
            }
        }
        .padding(16)
        .background(Color(hex: "15181c").opacity(0.95))
        .cornerRadius(16)
        .frame(width: 280)
    }

    private func statChip(label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label.uppercased())
                .font(.caption2)
                .foregroundStyle(Color(hex: "9aa3ad"))
            Text(value)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white)
        }
        .padding(10)
        .background(Color(hex: "0b0d10"))
        .cornerRadius(12)
    }

    private var setupSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Guided Setup")
                .font(.title2.bold())
            Text("Follow the steps in order. Each step is tailored to the model.")
                .foregroundStyle(Color(hex: "9aa3ad"))

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 240), spacing: 12)], spacing: 12) {
                ForEach(steps) { step in
                    let checked = completed.contains(step.id)
                    VStack(alignment: .leading, spacing: 10) {
                        HStack(spacing: 10) {
                            ZStack {
                                RoundedRectangle(cornerRadius: 6)
                                    .stroke(Color.white.opacity(0.2), lineWidth: 1)
                                    .background(checked ? Color(hex: "4de2a4") : Color.clear)
                                    .frame(width: 22, height: 22)
                                if checked {
                                    Text("✓")
                                        .foregroundStyle(Color(hex: "0b0d10"))
                                        .font(.caption.bold())
                                }
                            }
                            Text(step.title)
                                .foregroundStyle(.white)
                                .font(.headline)
                        }
                        Text(step.summary)
                            .foregroundStyle(Color(hex: "cbd5df"))
                            .font(.subheadline)
                        Text(step.actions.joined(separator: " | "))
                            .foregroundStyle(Color(hex: "9aa3ad"))
                            .font(.caption)
                        Text(model)
                            .font(.caption)
                            .foregroundStyle(Color(hex: "6ee8ff"))
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color(hex: "6ee8ff").opacity(0.15))
                            .clipShape(Capsule())
                    }
                    .padding(14)
                    .background(Color(hex: "15181c"))
                    .cornerRadius(16)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(checked ? Color(hex: "4de2a4").opacity(0.4) : Color.white.opacity(0.05), lineWidth: 1))
                    .onTapGesture {
                        toggleStep(step.id)
                    }
                }
            }
        }
    }

    private var troubleshootingSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Troubleshooting")
                .font(.title2.bold())
            Text("Search symptoms and get a direct fix. Tap a card to expand details.")
                .foregroundStyle(Color(hex: "9aa3ad"))

            TextField("white screen, no print, offline", text: $issueQuery)
                .padding(12)
                .background(Color(hex: "1b1f24"))
                .cornerRadius(12)
                .foregroundStyle(.white)

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 240), spacing: 12)], spacing: 12) {
                ForEach(filteredIssues) { issue in
                    let isOpen = openIssues.contains(issue.id)
                    VStack(alignment: .leading, spacing: 8) {
                        Text(issue.title)
                            .foregroundStyle(.white)
                            .font(.headline)
                        Text(issue.steps.joined(separator: " | "))
                            .foregroundStyle(Color(hex: "9aa3ad"))
                            .font(.caption)
                        if isOpen {
                            Text("Fix: \(issue.steps.joined(separator: " -> "))")
                                .foregroundStyle(Color(hex: "c7d0c8"))
                                .font(.caption)
                        }
                    }
                    .padding(14)
                    .background(Color(hex: "15181c"))
                    .cornerRadius(16)
                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(isOpen ? Color(hex: "4de2a4").opacity(0.4) : Color.white.opacity(0.05), lineWidth: 1))
                    .onTapGesture {
                        toggleIssue(issue.id)
                    }
                }
            }
        }
    }

    private var chatbotSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Ask the Chatbot")
                .font(.title2.bold())
            Text("Fast answers from the knowledge base dataset.")
                .foregroundStyle(Color(hex: "9aa3ad"))

            HStack {
                TextField("How do I connect to Wi-Fi?", text: $chatInput)
                    .padding(12)
                    .background(Color(hex: "1b1f24"))
                    .cornerRadius(12)
                    .foregroundStyle(.white)

                Button("Ask") {
                    handleAsk()
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(Color(hex: "6ee8ff"))
                .foregroundStyle(Color(hex: "0b0d10"))
                .cornerRadius(12)
            }

            Text(chatAnswer)
                .foregroundStyle(Color(hex: "cbd5df"))
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(hex: "15181c"))
                .cornerRadius(16)
        }
    }

    private func handleScan() {
        let detected = resolveModel(serial)
        if detected == "Unknown" {
            serialMessage = "Model not recognized. Check the serial format it should EV001693-20230."
            model = "Unknown"
        } else {
            model = detected
            serialMessage = "Model detected: \(detected)"
        }
    }

    private func matchesSerial(_ value: String) -> Bool {
        guard let regex = serialRegex else { return false }
        let range = NSRange(value.startIndex..<value.endIndex, in: value)
        return regex.firstMatch(in: value, options: [], range: range) != nil
    }

    private func resolveModel(_ serial: String) -> String {
        guard let year = parseYear(serial) else { return "Unknown" }
        if year >= "2025" { return "LP3" }
        if year >= "2024" { return "LP1" }
        return "SOM"
    }

    private func parseYear(_ serial: String) -> String? {
        let pattern = /^EV\d{6}-(\d{5,8})$/
        guard let match = serial.firstMatch(of: pattern) else { return nil }
        let raw = String(match.1)
        return String(raw.prefix(4))
    }

    private func toggleStep(_ id: String) {
        if completed.contains(id) {
            completed.remove(id)
        } else {
            completed.insert(id)
        }
    }

    private func toggleIssue(_ id: String) {
        if openIssues.contains(id) {
            openIssues.remove(id)
        } else {
            openIssues.insert(id)
        }
    }

    private func handleAsk() {
        let query = chatInput.lowercased()
        guard !query.trimmingCharacters(in: .whitespaces).isEmpty else {
            chatAnswer = "Ask a question to see an answer."
            return
        }

        var best = chatbot.first
        var bestScore = 0

        for item in chatbot {
            let haystack = (item.q + " " + item.a).lowercased()
            let words = query.split(separator: " ")
            var score = 0
            for word in words where word.count > 2 {
                if haystack.contains(word) { score += 1 }
            }
            if score > bestScore {
                bestScore = score
                best = item
            }
        }

        guard let response = best?.a else { return }
        startTyping(response)
    }

    private func startTyping(_ text: String) {
        typingTimer?.invalidate()
        chatAnswer = ""
        typingIndex = 0
        typingTimer = Timer.scheduledTimer(withTimeInterval: 0.018, repeats: true) { timer in
            if typingIndex >= text.count {
                timer.invalidate()
                return
            }
            let index = text.index(text.startIndex, offsetBy: typingIndex)
            chatAnswer.append(text[index])
            typingIndex += 1
        }
    }
}

private extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
