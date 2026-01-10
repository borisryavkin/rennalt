import json
import os
import zipfile
import xml.etree.ElementTree as ET


DB_DIR = os.path.join(os.path.dirname(__file__), "..", "database")
OUT_PATH = os.path.join(DB_DIR, "docx-data.js")

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}


def extract_docx_text(path):
    try:
        with zipfile.ZipFile(path) as zf:
            xml_data = zf.read("word/document.xml")
    except Exception:
        return ""

    root = ET.fromstring(xml_data)
    paragraphs = []
    for para in root.findall(".//w:p", NS):
        texts = [node.text for node in para.findall(".//w:t", NS) if node.text]
        line = "".join(texts).strip()
        if line:
            paragraphs.append(line)
    return "\n".join(paragraphs)


def main():
    docs = []
    for filename in sorted(os.listdir(DB_DIR)):
        if not filename.lower().endswith(".docx"):
            continue
        path = os.path.join(DB_DIR, filename)
        text = extract_docx_text(path)
        if not text:
            continue
        title = os.path.splitext(filename)[0]
        docs.append(
            {
                "id": f"docx:{filename}",
                "title": title,
                "body": text,
            }
        )

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write("const DOCX_DOCS = ")
        json.dump(docs, f, ensure_ascii=True)
        f.write(";\n")

    print(f"Wrote {len(docs)} docs to {OUT_PATH}")


if __name__ == "__main__":
    main()
