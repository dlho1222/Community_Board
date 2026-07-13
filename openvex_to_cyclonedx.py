import json
import sys

def convert_openvex_to_cyclonedx(openvex_path, cdx_path):
    try:
        with open(openvex_path, 'r', encoding='utf-8') as f:
            openvex = json.load(f)
        
        # 1. Base CycloneDX VEX structure
        cdx_vex = {
            "bomFormat": "CycloneDX",
            "specVersion": "1.5",
            "version": 1,
            "vulnerabilities": []
        }
        
        # 2. Translate statements
        for stmt in openvex.get("statements", []):
            vuln_id = stmt.get("vulnerability")
            status = stmt.get("status")
            justification = stmt.get("justification", "code_not_present")
            
            # Extract details from statement if present
            # OpenVEX has 'statement' field for detailed comments
            detail = stmt.get("statement", "Mitigated or not applicable in this environment.")
            
            # Map OpenVEX status to CycloneDX VEX state
            state = "not_affected"
            if status in ["not_affected", "affected", "fixed", "under_investigation"]:
                state = status
            
            cdx_vuln = {
                "id": vuln_id,
                "analysis": {
                    "state": state,
                    "justification": justification,
                    "detail": detail
                }
            }
            cdx_vex["vulnerabilities"].append(cdx_vuln)
            
        with open(cdx_path, 'w', encoding='utf-8') as f:
            json.dump(cdx_vex, f, indent=2, ensure_ascii=False)
            
        print(f"Successfully converted OpenVEX ({openvex_path}) to CycloneDX VEX ({cdx_path})")
    except Exception as e:
        print(f"Error during conversion: {e}")
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python openvex_to_cyclonedx.py <input-openvex.json> <output-cyclonedx-vex.json>")
        sys.exit(1)
    convert_openvex_to_cyclonedx(sys.argv[1], sys.argv[2])
