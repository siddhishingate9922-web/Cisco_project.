from flask import Flask, jsonify, request, render_template
import json
import os

app = Flask(__name__)

KNOWLEDGE_BASE_FILE = "knowledge_base.json"


def load_cases():
    with open("cases.json", "r") as file:
        return json.load(file)


# --------------------------------------------------
# HOME
# --------------------------------------------------

@app.route("/")
def home():
    return render_template("index.html")


# --------------------------------------------------
# STATUS
# --------------------------------------------------

@app.route("/api/status")
def status():
    return jsonify({
        "status": "success",
        "message": "Backend API is working"
    })


# --------------------------------------------------
# CASES
# --------------------------------------------------

@app.route("/api/cases")
def get_cases():

    cases = load_cases()

    return jsonify({
        "total_cases": len(cases),
        "cases": cases
    })


# --------------------------------------------------
# FAULT ANALYSIS
# --------------------------------------------------

@app.route("/api/analyze", methods=["POST"])
def analyze():

    data = request.get_json()

    fault = data.get("fault", "").lower().strip()

    if not fault:
        return jsonify({
            "status": "error",
            "message": "No fault evidence provided"
        }), 400

    cases = load_cases()

    best_match = None
    best_score = 0

    # Match fault evidence with predefined cases
    for case in cases:

        evidence = case["fault_evidence"].lower()

        words = evidence.replace(";", " ").split()

        score = 0

        for word in words:

            if len(word) > 3 and word in fault:
                score += 1

        if score > best_score:

            best_score = score
            best_match = case

    # Matching case found
    if best_match and best_score >= 1:

        return jsonify({
            "status": "success",
            "case_id": best_match["case_id"],
            "category": best_match["category"],
            "fault_received": fault,
            "diagnosis": best_match["diagnosis"],
            "severity": best_match["severity"],
            "solution": best_match["solution"]
        })

    # No matching case
    return jsonify({
        "status": "success",
        "case_id": None,
        "category": "Unknown",
        "fault_received": fault,
        "diagnosis": "Unknown network fault",
        "severity": "Unknown",
        "solution": "Collect more Cisco show-command information for further analysis."
    })


# --------------------------------------------------
# HUMAN EVALUATION
# --------------------------------------------------

@app.route("/api/evaluate", methods=["POST"])
def evaluate():

    data = request.get_json()

    if not data:
        return jsonify({
            "error": "Evaluation data is required"
        }), 400

    fault = data.get("fault", "")
    diagnosis = data.get("diagnosis", "")
    suggested_solution = data.get("suggested_solution", "")
    decision = data.get("decision", "").lower()
    corrected_solution = data.get("corrected_solution", "")

    if decision not in ["approved", "rejected"]:

        return jsonify({
            "error": "Decision must be 'approved' or 'rejected'"
        }), 400

    # Approved by human
    if decision == "approved":

        validated_solution = suggested_solution

    # Rejected and corrected by human
    else:

        if not corrected_solution:

            return jsonify({
                "error": "Corrected solution is required when decision is rejected"
            }), 400

        validated_solution = corrected_solution

    record = {
        "fault": fault,
        "diagnosis": diagnosis,
        "suggested_solution": suggested_solution,
        "human_decision": decision,
        "corrected_solution": corrected_solution,
        "validated_solution": validated_solution
    }

    # Load existing knowledge base
    if os.path.exists(KNOWLEDGE_BASE_FILE):

        with open(KNOWLEDGE_BASE_FILE, "r") as file:
            knowledge_base = json.load(file)

    else:

        knowledge_base = []

    # Add validated case
    knowledge_base.append(record)

    # Save knowledge base
    with open(KNOWLEDGE_BASE_FILE, "w") as file:

        json.dump(
            knowledge_base,
            file,
            indent=4
        )

    return jsonify({
        "status": "success",
        "message": "Human evaluation completed",
        "human_decision": decision,
        "validated_solution": validated_solution,
        "knowledge_base": "Solution added successfully"
    })


# --------------------------------------------------
# KNOWLEDGE BASE
# --------------------------------------------------

@app.route("/api/knowledge-base", methods=["GET"])
def knowledge_base():

    if os.path.exists(KNOWLEDGE_BASE_FILE):

        with open(KNOWLEDGE_BASE_FILE, "r") as file:
            data = json.load(file)

    else:

        data = []

    return jsonify({
        "total_cases": len(data),
        "cases": data
    })


# --------------------------------------------------
# START SERVER
# --------------------------------------------------

if __name__ == "__main__":
    app.run(debug=False)