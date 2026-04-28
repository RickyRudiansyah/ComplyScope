import os
from pathlib import Path
from dotenv import load_dotenv
from azure.core.credentials import AzureKeyCredential
from azure.ai.documentintelligence import DocumentIntelligenceClient

# Load .env.local
load_dotenv()

endpoint = os.getenv("AZURE_DOC_INTEL_ENDPOINT")
key = os.getenv("AZURE_DOC_INTEL_KEY")
model_id = os.getenv("AZURE_DOC_INTEL_MODEL_ID", "prebuilt-layout")

if not endpoint:
    raise ValueError("AZURE_DOC_INTEL_ENDPOINT belum terbaca dari .env.local")

if not key:
    raise ValueError("AZURE_DOC_INTEL_KEY belum terbaca dari .env.local")

client = DocumentIntelligenceClient(
    endpoint=endpoint,
    credential=AzureKeyCredential(key)
)

pdf_path = Path("datasets/demo_docs/batch_mismatch/coa_batch_mismatch.pdf")

if not pdf_path.exists():
    raise FileNotFoundError(f"File PDF tidak ditemukan: {pdf_path}")

print("Testing Document Intelligence...")
print("PDF:", pdf_path)
print("Model:", model_id)

with open(pdf_path, "rb") as f:
    poller = client.begin_analyze_document(
        model_id=model_id,
        body=f,
        content_type="application/pdf"
    )

result = poller.result()

print("\n=== SUMMARY ===")
print("Pages:", len(result.pages) if result.pages else 0)
print("Tables:", len(result.tables) if result.tables else 0)

print("\n=== EXTRACTED TEXT ===")

all_text = []

for page in result.pages:
    print(f"\n--- Page {page.page_number} ---")

    if page.lines:
        for line in page.lines:
            print(line.content)
            all_text.append(line.content)

print("\n=== TABLES ===")

if result.tables:
    for table_idx, table in enumerate(result.tables, start=1):
        print(f"\n--- Table {table_idx} ---")
        print(f"Rows: {table.row_count}, Columns: {table.column_count}")

        cells = sorted(
            table.cells,
            key=lambda c: (c.row_index, c.column_index)
        )

        current_row = -1
        row_values = []

        for cell in cells:
            if cell.row_index != current_row:
                if row_values:
                    print(" | ".join(row_values))
                current_row = cell.row_index
                row_values = []

            row_values.append(cell.content.replace("\n", " "))

        if row_values:
            print(" | ".join(row_values))
else:
    print("No tables detected.")

# Simpan hasil text ke file
output_path = Path("azure_docintel_output.txt")
output_path.write_text("\n".join(all_text), encoding="utf-8")

print(f"\nDone. Extracted text saved to: {output_path}")