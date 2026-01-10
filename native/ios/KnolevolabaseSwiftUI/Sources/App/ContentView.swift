import AVFoundation
import SwiftUI

struct ContentView: View {
    @StateObject private var historyStore = HistoryStore()
    @State private var hasPermission = false
    @State private var lastValue: String?
    @State private var lastAt = Date.distantPast

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                Text("Scan EV0 serial")
                    .font(.headline)

                if hasPermission {
                    CameraView { value in
                        let now = Date()
                        if value == lastValue, now.timeIntervalSince(lastAt) < 1.5 {
                            return
                        }
                        lastValue = value
                        lastAt = now
                        historyStore.add(value: value)
                    }
                    .aspectRatio(4.0 / 3.0, contentMode: .fit)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                } else {
                    Text("Camera permission is required to scan EV0 serials.")
                        .font(.subheadline)
                }

                Text("History")
                    .font(.headline)

                if historyStore.history.isEmpty {
                    Text("No scans yet.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                } else {
                    List(historyStore.history) { record in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(record.value)
                                .font(.body)
                            Text(record.timestamp.formatted(date: .numeric, time: .standard))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 4)
                    }
                    .listStyle(.plain)
                }
            }
            .padding()
            .navigationTitle("Scanner")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Clear history") {
                        historyStore.clear()
                    }
                    .disabled(historyStore.history.isEmpty)
                }
            }
        }
        .task {
            await requestCameraPermission()
        }
    }

    private func requestCameraPermission() async {
        let status = AVCaptureDevice.authorizationStatus(for: .video)
        switch status {
        case .authorized:
            hasPermission = true
        case .notDetermined:
            let granted = await AVCaptureDevice.requestAccess(for: .video)
            hasPermission = granted
        default:
            hasPermission = false
        }
    }
}
