import json
import os
import sys

def load_json(filepath):
    if not os.path.exists(filepath):
        return None
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"⚠️ Error reading {filepath}: {e}")
        return None

def main():
    if len(sys.argv) < 5:
        print("Usage: python3 merge_vex.py <downloaded_vex.json> <local_vex.json> <merged_output_vex.json> <grype_output.yaml>")
        sys.exit(1)

    downloaded_path = sys.argv[1]
    local_path = sys.argv[2]
    merged_vex_path = sys.argv[3]
    grype_config_path = sys.argv[4]

    # Load VEX files
    downloaded_vex = load_json(downloaded_path) or {}
    local_vex = load_json(local_path) or {}

    # Initialize merged VEX skeleton
    merged_vex = {
        "bomFormat": "CycloneDX",
        "specVersion": "1.5",
        "version": 1,
        "metadata": {
            "timestamp": "2026-07-10T00:00:00Z",
            "tools": [
                {
                    "vendor": "DevSecOps-Pipeline",
                    "name": "VEX-Merger",
                    "version": "1.0.0"
                }
            ]
        },
        "vulnerabilities": []
    }

    # Use metadata from downloaded VEX if available
    if "metadata" in downloaded_vex:
        merged_vex["metadata"] = downloaded_vex["metadata"]
    
    # Merge vulnerabilities
    vuln_map = {}

    # 1. Load downloaded vulnerabilities
    for vuln in downloaded_vex.get("vulnerabilities", []):
        vuln_id = vuln.get("id")
        if vuln_id:
            vuln_map[vuln_id] = vuln

    # 2. Load local vulnerabilities (can override downloaded ones)
    for vuln in local_vex.get("vulnerabilities", []):
        vuln_id = vuln.get("id")
        if vuln_id:
            vuln_map[vuln_id] = vuln

    merged_vex["vulnerabilities"] = list(vuln_map.values())

    # Write merged standard CycloneDX VEX JSON
    with open(merged_vex_path, 'w', encoding='utf-8') as f:
        json.dump(merged_vex, f, indent=2, ensure_ascii=False)
    print(f"✅ Generated consolidated VEX: {merged_vex_path}")

    # Extract ignored CVE list for Grype config
    # States that represent a suppressed/ignored vulnerability in CycloneDX VEX (lowercase)
    ignored_states = ["not_affected", "false_positive", "resolved", "wont_fix", "resolved_with_mitigation"]
    ignored_cves = []

    for vuln in merged_vex["vulnerabilities"]:
        vuln_id = vuln.get("id")
        analysis = vuln.get("analysis", {})
        state = analysis.get("state", "").lower()
        
        # Also check for isSuppressed boolean if present in analysis
        is_suppressed = analysis.get("isSuppressed") == True

        if state in ignored_states or is_suppressed:
            if vuln_id:
                ignored_cves.append(vuln_id)

    # Write Grype YAML config
    with open(grype_config_path, 'w', encoding='utf-8') as out:
        out.write("ignore:\n")
        if ignored_cves:
            for v in sorted(set(ignored_cves)):
                out.write(f"  - vulnerability: \"{v}\"\n    reason: \"Suppressed in VEX\"\n")
            print(f"🛡️ Generated {grype_config_path} with {len(set(ignored_cves))} ignored CVEs.")
        else:
            print(f"ℹ️ No suppressed CVEs found in merged VEX. {grype_config_path} is empty.")

if __name__ == "__main__":
    main()
