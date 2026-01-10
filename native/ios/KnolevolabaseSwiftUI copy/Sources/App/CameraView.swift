import AVFoundation
import SwiftUI
import Vision

struct CameraView: UIViewRepresentable {
    final class CameraViewModel: NSObject, AVCaptureVideoDataOutputSampleBufferDelegate {
        var onSerialScanned: ((String) -> Void)?

        private let session = AVCaptureSession()
        private let output = AVCaptureVideoDataOutput()
        private let sessionQueue = DispatchQueue(label: "qrscanner.camera.session")
        private let processingQueue = DispatchQueue(label: "qrscanner.camera.processing")
        private var isProcessing = false

        func configure() {
            session.beginConfiguration()
            session.sessionPreset = .high

            guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
                  let input = try? AVCaptureDeviceInput(device: device),
                  session.canAddInput(input) else {
                session.commitConfiguration()
                return
            }
            session.addInput(input)

            output.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
            output.alwaysDiscardsLateVideoFrames = true

            if session.canAddOutput(output) {
                session.addOutput(output)
                output.setSampleBufferDelegate(self, queue: processingQueue)
            }

            session.commitConfiguration()
        }

        func start() {
            sessionQueue.async { [weak self] in
                guard let self else { return }
                if !self.session.isRunning {
                    self.session.startRunning()
                }
            }
        }

        func stop() {
            sessionQueue.async { [weak self] in
                guard let self else { return }
                if self.session.isRunning {
                    self.session.stopRunning()
                }
            }
        }

        func attachPreview(to view: PreviewView) {
            view.previewLayer.session = session
            view.previewLayer.videoGravity = .resizeAspectFill
        }

        func captureOutput(
            _ output: AVCaptureOutput,
            didOutput sampleBuffer: CMSampleBuffer,
            from connection: AVCaptureConnection
        ) {
            guard !isProcessing else { return }
            isProcessing = true

            guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
                isProcessing = false
                return
            }

            let request = VNRecognizeTextRequest { [weak self] request, _ in
                defer { self?.isProcessing = false }
                guard let self else { return }
                guard let observations = request.results as? [VNRecognizedTextObservation] else { return }

                let text = observations
                    .compactMap { $0.topCandidates(1).first?.string }
                    .joined(separator: " ")

                if let serial = self.extractSerial(from: text) {
                    DispatchQueue.main.async {
                        self.onSerialScanned?(serial)
                    }
                }
            }

            request.recognitionLevel = .accurate
            request.usesLanguageCorrection = false

            let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: .right, options: [:])
            do {
                try handler.perform([request])
            } catch {
                isProcessing = false
            }
        }

        private func extractSerial(from text: String) -> String? {
            let pattern = "\\bEV0[0-9A-Z]*-[0-9A-Z]+\\b"
            let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive])
            let range = NSRange(text.startIndex..<text.endIndex, in: text)
            let matches = regex?.matches(in: text, options: [], range: range) ?? []
            let values = matches.compactMap { match -> String? in
                guard let range = Range(match.range, in: text) else { return nil }
                return String(text[range])
            }
            guard let best = values.max(by: { $0.count < $1.count }) else { return nil }
            return best.uppercased()
        }
    }

    final class PreviewView: UIView {
        override class var layerClass: AnyClass {
            AVCaptureVideoPreviewLayer.self
        }

        var previewLayer: AVCaptureVideoPreviewLayer {
            guard let layer = layer as? AVCaptureVideoPreviewLayer else {
                return AVCaptureVideoPreviewLayer()
            }
            return layer
        }
    }

    var onSerialScanned: (String) -> Void

    final class Coordinator {
        let viewModel = CameraViewModel()
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> PreviewView {
        let view = PreviewView()
        let viewModel = context.coordinator.viewModel
        viewModel.onSerialScanned = onSerialScanned
        viewModel.configure()
        viewModel.attachPreview(to: view)
        viewModel.start()
        return view
    }

    func updateUIView(_ uiView: PreviewView, context: Context) {
        let viewModel = context.coordinator.viewModel
        viewModel.onSerialScanned = onSerialScanned
        viewModel.attachPreview(to: uiView)
    }

    static func dismantleUIView(_ uiView: PreviewView, coordinator: Coordinator) {
        coordinator.viewModel.stop()
        uiView.previewLayer.session = nil
    }
}
