import Foundation

struct ScanRecord: Identifiable, Codable {
    let id: UUID
    let value: String
    let timestamp: Date

    init(value: String, timestamp: Date = Date()) {
        self.id = UUID()
        self.value = value
        self.timestamp = timestamp
    }
}

final class HistoryStore: ObservableObject {
    @Published private(set) var history: [ScanRecord] = []

    private let storeKey = "qrscanner.history"

    init() {
        load()
    }

    func add(value: String) {
        let record = ScanRecord(value: value)
        history.insert(record, at: 0)
        save()
    }

    func clear() {
        history.removeAll()
        save()
    }

    private func load() {
        guard let data = UserDefaults.standard.data(forKey: storeKey) else { return }
        let decoded = (try? JSONDecoder().decode([ScanRecord].self, from: data)) ?? []
        history = decoded
    }

    private func save() {
        guard let data = try? JSONEncoder().encode(history) else { return }
        UserDefaults.standard.set(data, forKey: storeKey)
    }
}
