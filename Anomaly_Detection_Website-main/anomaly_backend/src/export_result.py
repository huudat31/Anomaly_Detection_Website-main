import json
import numpy as np

def export_results(anomalies, losses, output_path="result.json"):
    # Chuyển NaN thành 0 để JSON hợp lệ
    losses_clean = [0 if (isinstance(x, float) and np.isnan(x)) else x for x in losses.tolist()]
    # Thêm logging để debug giá trị anomalies và losses
    print(f"[DEBUG] anomalies: {anomalies.tolist()[:10]} ... (total: {len(anomalies)})")
    print(f"[DEBUG] losses: {losses_clean[:10]} ... (total: {len(losses_clean)})")
    result = {
        "anomalies": anomalies.tolist(),
        "losses": losses_clean
    }
    with open(output_path, "w") as f:
        json.dump(result, f, indent=4)
