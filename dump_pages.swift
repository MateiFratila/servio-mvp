import Foundation
import PDFKit
import CoreGraphics
import Cocoa

func exportPage(index: Int, filename: String, scaleSetting: CGFloat = 4.0) {
    let aiURL = URL(fileURLWithPath: "logo.ai")
    guard let pdf = PDFDocument(url: aiURL), index < pdf.pageCount else { return }
    guard let page = pdf.page(at: index) else { return }
    let pageBounds = page.bounds(for: .mediaBox)
    let size = pageBounds.size
    let targetSize = NSSize(width: size.width * scaleSetting, height: size.height * scaleSetting)
    let image = NSImage(size: targetSize)
    image.lockFocus()
    guard let context = NSGraphicsContext.current?.cgContext else { return }
    context.clear(CGRect(origin: .zero, size: targetSize))
    context.scaleBy(x: scaleSetting, y: scaleSetting)
    context.translateBy(x: -pageBounds.origin.x, y: -pageBounds.origin.y)
    page.draw(with: .mediaBox, to: context)
    image.unlockFocus()
    if let tiffData = image.tiffRepresentation,
       let bitmapRep = NSBitmapImageRep(data: tiffData),
       let pngData = bitmapRep.representation(using: .png, properties: [:]) {
        try? pngData.write(to: URL(fileURLWithPath: filename))
    }
}

// Let's export all pages to see what is on them
let aiURL = URL(fileURLWithPath: "logo.ai")
if let pdf = PDFDocument(url: aiURL) {
    print("Exporting \(pdf.pageCount) pages...")
    for i in 0..<pdf.pageCount {
        exportPage(index: i, filename: "page_\(i).png", scaleSetting: 1.0)
    }
}
