import json
from pathlib import Path

ROOT = Path(".")
required_files = [
    "README.md",
    "PROJECT_CONTEXT.md",
    ".env",
    ".gitignore",
    "backend/data/seed_materials.json",
    "backend/data/seed_suppliers.json",
    "backend/data/seed_specs.json",
    "backend/data/field_aliases.json",
    "backend/data/table_header_aliases.json",
    "backend/data/demo_extractions.json",
]

scenario_files = {
    "valid": ["coa_valid.html", "label_valid.html"],
    "batch_mismatch": ["coa_batch_mismatch.html", "label_batch_mismatch.html"],
    "test_result_out_of_spec": ["coa_test_result_out_of_spec.html", "label_test_result_out_of_spec.html"],
    "supplier_not_approved": ["coa_supplier_not_approved.html", "label_supplier_not_approved.html"],
}

print("Checking required files...")
missing = []
for file in required_files:
    if not (ROOT / file).exists():
        missing.append(file)

for scenario, files in scenario_files.items():
    for file in files:
        path = ROOT / "datasets" / "demo_docs" / scenario / file
        if not path.exists():
            missing.append(str(path))

if missing:
    print("MISSING FILES:")
    for item in missing:
        print("-", item)
    raise SystemExit(1)

print("All required files exist.")

def load_json(path):
    with open(ROOT / path, "r", encoding="utf-8") as f:
        return json.load(f)

materials = load_json("backend/data/seed_materials.json")
suppliers = load_json("backend/data/seed_suppliers.json")
specs = load_json("backend/data/seed_specs.json")
demo = load_json("backend/data/demo_extractions.json")

print("Checking material...")
materials_text = json.dumps(materials)
assert "MAT-PCM-001" in materials_text, "MAT-PCM-001 not found in seed_materials.json"
assert "Paracetamol API" in materials_text, "Paracetamol API not found in seed_materials.json"

print("Checking specs are generic, not assay-only...")
specs_text = json.dumps(specs)
for param in ["Appearance", "Identification", "Assay", "Moisture"]:
    assert param in specs_text, f"{param} not found in seed_specs.json"

bad_assay_only_keys = ["assay_min", "assay_max", "assay_result"]
for key in bad_assay_only_keys:
    assert key not in specs_text, f"Found hardcoded assay-only key in specs: {key}"

assert "TEST_RESULT_OUT_OF_SPEC" not in specs_text, "seed_specs should not contain validation findings"

print("Checking aliases...")
field_aliases_raw = load_json("backend/data/field_aliases.json")
table_aliases_raw = load_json("backend/data/table_header_aliases.json")

field_aliases = field_aliases_raw.get("aliases", field_aliases_raw)
table_aliases = table_aliases_raw.get("aliases", table_aliases_raw)

assert "batch_no" in field_aliases, "batch_no missing in field_aliases"
assert "Lot Number" in field_aliases["batch_no"], "Lot Number alias missing"
assert "parameter" in table_aliases, "parameter missing in table_header_aliases"
assert "Analysis" in table_aliases["parameter"], "Analysis alias missing"

print("Checking demo extractions...")
demo_text = json.dumps(demo)
for scenario in ["valid", "batch_mismatch", "test_result_out_of_spec", "supplier_not_approved"]:
    assert scenario in demo_text, f"{scenario} not found in demo_extractions.json"

assert "test_results" in demo_text, "demo_extractions must use generic test_results[]"
for bad in bad_assay_only_keys:
    assert bad not in demo_text, f"demo_extractions should not use assay-only field as primary structure: {bad}"

assert "PCM-2026-999" in demo_text, "batch mismatch value PCM-2026-999 not found"
assert "97.2" in demo_text, "out-of-spec assay result 97.2 not found"
assert "PT Global Chemical Trading" in demo_text, "not-approved supplier not found"

print("Checking HTML content basics...")
for scenario, files in scenario_files.items():
    for file in files:
        path = ROOT / "datasets" / "demo_docs" / scenario / file
        content = path.read_text(encoding="utf-8", errors="ignore")
        assert "Paracetamol API" in content, f"Paracetamol API missing in {path}"
        assert "MAT-PCM-001" in content, f"MAT-PCM-001 missing in {path}"

print("\nTask 0 & 1 sanity check PASSED.")