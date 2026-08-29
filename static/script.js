let currentFault = "";
let currentDiagnosis = "";
let currentSolution = "";


// ==========================================
// ANALYZE FAULT
// ==========================================

async function analyzeFault() {

    const fault =
        document.getElementById("faultInput").value;

    if (!fault.trim()) {

        alert("Please enter Cisco fault evidence.");

        return;
    }

    try {

        const response = await fetch("/api/analyze", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                fault: fault
            })
        });


        const data = await response.json();


        currentFault = fault;

        currentDiagnosis = data.diagnosis;

        currentSolution = data.solution;


        document.getElementById("caseId").textContent =
            data.case_id ?? "None";


        document.getElementById("category").textContent =
            data.category;


        document.getElementById("diagnosis").textContent =
            data.diagnosis;


        document.getElementById("severity").textContent =
            data.severity;


        document.getElementById("solution").textContent =
            data.solution;


        document.getElementById("analysisStatus").textContent =
            "PENDING";


        document
            .getElementById("resultSection")
            .classList.remove("hidden");


        document
            .getElementById("successSection")
            .classList.add("hidden");


        document
            .getElementById("correctionSection")
            .classList.add("hidden");


        window.scrollTo({
            top: document
                .getElementById("resultSection")
                .offsetTop - 20,
            behavior: "smooth"
        });

    }

    catch (error) {

        alert("Unable to connect to the Flask backend.");

        console.error(error);

    }
}



// ==========================================
// APPROVE SOLUTION
// ==========================================

async function approveSolution() {

    try {

        const response = await fetch("/api/evaluate", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                fault: currentFault,

                diagnosis: currentDiagnosis,

                suggested_solution: currentSolution,

                decision: "approved",

                corrected_solution: ""
            })
        });


        const data = await response.json();


        showValidation(data);

    }

    catch (error) {

        alert("Unable to submit human evaluation.");

        console.error(error);

    }
}



// ==========================================
// SHOW CORRECTION
// ==========================================

function showCorrection() {

    document
        .getElementById("correctionSection")
        .classList.remove("hidden");

}



// ==========================================
// SUBMIT CORRECTION
// ==========================================

async function submitCorrection() {

    const correctedSolution =
        document
            .getElementById("correctedSolution")
            .value;


    if (!correctedSolution.trim()) {

        alert("Please enter the corrected solution.");

        return;
    }


    try {

        const response = await fetch("/api/evaluate", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                fault: currentFault,

                diagnosis: currentDiagnosis,

                suggested_solution: currentSolution,

                decision: "rejected",

                corrected_solution: correctedSolution
            })
        });


        const data = await response.json();


        showValidation(data);

    }

    catch (error) {

        alert("Unable to submit correction.");

        console.error(error);

    }
}



// ==========================================
// SHOW VALIDATION
// ==========================================

function showValidation(data) {

    document
        .getElementById("successSection")
        .classList.remove("hidden");


    document
        .getElementById("analysisStatus")
        .textContent = "VALIDATED";


    document
        .getElementById("analysisStatus")
        .className = "pending";


    document
        .getElementById("validationMessage")
        .textContent =
            "Human decision: " +
            data.human_decision +
            " | Validated solution: " +
            data.validated_solution;


    window.scrollTo({
        top: document
            .getElementById("successSection")
            .offsetTop - 20,
        behavior: "smooth"
    });

}



// ==========================================
// LOAD KNOWLEDGE BASE
// ==========================================

async function loadKnowledgeBase() {

    try {

        const response =
            await fetch("/api/knowledge-base");


        const data =
            await response.json();


        const container =
            document.getElementById("knowledgeBase");


        container.innerHTML = "";


        if (data.total_cases === 0) {

            container.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">
                        ◫
                    </div>

                    <div>
                        <strong>No validated cases yet.</strong>

                        <p>
                            Validate a case by approving or correcting a diagnosis.
                        </p>
                    </div>

                </div>

            `;

            return;
        }


        data.cases.forEach(function(caseData, index) {

            const div =
                document.createElement("div");


            div.className = "case";


            div.innerHTML = `

                <div class="case-title">
                    Validated Case ${index + 1}
                </div>

                <p>
                    <strong>Fault:</strong>
                    ${caseData.fault}
                </p>

                <p>
                    <strong>Diagnosis:</strong>
                    ${caseData.diagnosis}
                </p>

                <p>
                    <strong>Human Decision:</strong>
                    ${caseData.human_decision}
                </p>

                <p>
                    <strong>Validated Solution:</strong>
                    ${caseData.validated_solution}
                </p>

            `;


            container.appendChild(div);

        });

    }

   catch (error) {

    console.error("Analyze error:", error);

    alert("Error: " + error.message);

}

    }

}
