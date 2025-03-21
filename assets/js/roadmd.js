document.addEventListener("DOMContentLoaded", function () {
    const data = {
        symptoms: ["Transverse Cracking",
            "Longitudinal Cracking",
            "Edge Cracking",
            "Block Cracking",
            "Alligator Cracking",
            "Pothole",
            "Patch",
            "Distortion",
            "Shoving",
            "Rutting",
            "Ravelling",
            "Bleeding"],
        causes: ["Frost Heave",
            "Hot Weather",
            "Weak Asphalt Mix",
            "Lack Of Asphalt",
            "Too High Asphalt Mix",
            "Base Failure",
            "High Fine Aggregate Content",
            "Low Air Voids",
            "Heavy Prime Or Tack Cost",
            "Fine Aggregate Mix",
            "Inadequate Design Of Layer Thickness",
            "Improper Or Inferior Materials",
            "Insufficient Base Structure",
            "Improper Compaction",
            "Rounded Or Smoothed Aggregate",
            "Inadequately Applied Seal Coat",
            "Load Induced By Heavy Traffic",
            "Low Traffic Volume",
            "Heavy Loading Vehicle Movement",
            "Poor Drainage",
            "Excessive Moisture",
            "Continued Deterioration Of Other Defect Type"],
        diseases: ["Cracking",
            "Disintegration",
            "Surface Deformation",
            "Surface Defects"],
        repairStrategies: ["Root And Seal",
            "Clean And Seal",
            "Asphalt Emulsion",
            "Rubberised Fillers",
            "Microsurfacing Material",
            "Full-Depth Crack Repair",
            "Cold-Mix Asphalt",
            "Hot-Mix Asphalt",
            "Spray Injection",
            "Slurry Or Microsurfacing",
            "Slurry Seal",
            "Seal Coat",
            "Double Chip Seal",
            "Microsurfacing",
            "Thin Hot-Mix Overlay",
            "Hot In-Place Recycling, Thin overlay",
            "Cold In-Place Recycling, Thin overlay",
            "Fog Seal"],
        traditionalStrategies: ["No Available Treatment",
            "Avoid Similar Mistakes During Maintenance And Reconstruction",
            "Lanes Designed For Different Vehicle",
            "Improve Traffic Allocation",
            "Implement Speed Reduction Measures",
            "Drain Surface Water",
            "Repair Surrounding Devices"],
        timeSync: ["3",
            "3",
            "1",
            "2-3",
            "2-3",
            "5",
            "1",
            "1",
            "5",
            "3-5",
            "3-5",
            "3-6",
            "7-10",
            "5-8",
            "5-8",
            "6-10",
            "6-15",
            "1-2"]
    };

    // Define Full, FullTotal, and severity matrices

    // 22x12 matrix: Causes (rows) → Symptoms (columns)
    const fullMatrix = [
        [1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0], // Row 1 (Cause 1 → Symptoms)
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // Row 2 (Cause 2 → Symptoms)
        [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0], // Row 3 (Cause 3 → Symptoms)
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0], // Row 4 (Cause 4 → Symptoms)
        [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1], // Row 5 (Cause 5 → Symptoms)
        [0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0], // Row 6 (Cause 6 → Symptoms)
        [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0], // Row 7 (Cause 7 → Symptoms)
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // Row 8 (Cause 8 → Symptoms)
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // Row 9 (Cause 9 → Symptoms)
        [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0], // Row 10 (Cause 10 → Symptoms)
        [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], // Row 11 (Cause 11 → Symptoms)
        [0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0], // Row 12 (Cause 12 → Symptoms)
        [0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0], // Row 13 (Cause 13 → Symptoms)
        [0, 0, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0], // Row 14 (Cause 14 → Symptoms)
        [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0], // Row 15 (Cause 15 → Symptoms)
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], // Row 16 (Cause 16 → Symptoms)
        [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0], // Row 17 (Cause 17 → Symptoms)
        [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0], // Row 18 (Cause 18 → Symptoms)
        [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0], // Row 19 (Cause 19 → Symptoms)
        [0, 0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0], // Row 20 (Cause 20 → Symptoms)
        [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0], // Row 21 (Cause 21 → Symptoms)
        [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0], // Row 22 (Cause 22 → Symptoms)
    ];

    // 4x18x12 matrix: Severity (keys) → Repair Strategies (rows) → Symptoms (columns)
    const fullTotalMatrix = { 
        "N/A": [
            [0.4, 0.4, 0, 0.1, 0, 0, 0, 0, 0, 0, 0, 0],
            [0.4, 0.4, 0, 0.1, 0, 0, 0, 0, 0, 0, 0, 0],
            [0.9, 1.0, 0.1, 0.6, 0, 0, 0, 0, 0, 0, 0, 0],
            [0.6, 1.0, 0.1, 0.6, 0, 0, 0, 0, 0, 0, 0, 0],
            [0.6, 1.0, 0.1, 0.6, 0, 0, 0, 0, 0, 0, 0, 0],
            [0.6, 0.6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0.6, 0.6, 0, 0.6, 0.9, 1.0, 0.9, 0.9, 1.0, 0, 0.6, 0],
            [0.6, 0.6, 0, 0.6, 0.9, 1.0, 0.9, 0.9, 1.0, 0, 0.6, 0],
            [0.6, 0.6, 0, 0.6, 0.9, 1.0, 0.9, 0.9, 1.0, 0, 0.6, 0],
            [0.6, 0.6, 0, 0.6, 0.9, 1.0, 0.9, 0.9, 1.0, 0, 0.6, 0],
            [0, 0, 0.1, 0, 0, 0, 0, 0, 0.4, 0, 0.6, 1.0],
            [1.0, 0, 0.4, 0.4, 0.1, 0, 0, 0, 0, 0, 0.9, 1.0],
            [1.0, 1.0, 1.0, 1.0, 0.1, 0, 0, 0, 0, 0.1, 0.6, 1.0],
            [0, 0, 0.1, 0, 0, 0, 0, 0, 1.0, 0, 0.6, 1.0],
            [0, 0, 1.0, 0.9, 0, 0, 0, 0, 0.9, 0.4, 0.6, 0.6],
            [0.9, 0.4, 0.4, 0.4, 0.4, 0, 0.4, 0.4, 1.0, 0.4, 0, 0],
            [1.0, 1.0, 1.0, 1.0, 1.0, 0, 0.9, 1.0, 1.0, 0.9, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.4, 0]
        ], 
        "Low": [
            [1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
            [1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1],
            [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
            [0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0],
            [0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0],
            [1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
        ], 
        "Medium": [
            [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
            [1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
            [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
            [0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0],
            [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0],
            [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]
        ], 
        "High": [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0],
            [1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0],
            [1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0],
            [1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
            [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
            [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1],
            [0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
            [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ] 
    };

    const symptomButtons = document.getElementById("symptom-buttons");
    const selectedSymptoms = document.getElementById("selected-symptoms");
    const input = document.getElementById("symptom-input");
    const autocompleteList = document.getElementById("autocomplete-list");
    const resultsContainer = document.getElementById("results");
    const diagnoseButton = document.getElementById("diagnose-button");

    // Populate symptom buttons for quick selection  
    data.symptoms.forEach(symptom => {
        let button = document.createElement("div");
        button.className = "symptom-button";
        button.textContent = symptom;
        button.onclick = () => addSymptom(symptom);
        symptomButtons.appendChild(button);
    });

    // Autocomplete function
    input.addEventListener("input", function () {
        autocompleteList.innerHTML = "";
        let value = input.value.toLowerCase();
        if (!value) {
            autocompleteList.style.display = "none";
            return;
        }
        let matches = data.symptoms.filter(symptom => symptom.toLowerCase().includes(value));
        matches.forEach(symptom => {
            let item = document.createElement("div");
            item.className = "autocomplete-item";
            item.textContent = symptom;
            item.onclick = function () {
                addSymptom(symptom);
                input.value = "";
                autocompleteList.style.display = "none";
            };
            autocompleteList.appendChild(item);
        });
        autocompleteList.style.display = "block";
    });

    // Add symptom function
    function addSymptom(symptom) {
        if (![...selectedSymptoms.children].some(el => el.textContent === symptom)) {
            let container = document.createElement("div");
            container.className = "symptom-container";
            container.dataset.symptom = symptom;

            let chip = document.createElement("span");
            chip.className = "symptom-chip";
            chip.textContent = symptom;
            
            let severitySelect = document.createElement("select");
            severitySelect.className = "severity-select";
            ["Low", "Medium", "High", "N/A"].forEach(level => {
                let option = document.createElement("option");
                option.value = level;
                option.textContent = level;
                severitySelect.appendChild(option);
            });

            let removeButton = document.createElement("button");
            removeButton.className = "remove-button";
            removeButton.textContent = "×";
            removeButton.onclick = () => container.remove();
            
            container.appendChild(chip);
            container.appendChild(severitySelect);
            container.appendChild(removeButton);
            selectedSymptoms.appendChild(container);
        }
    }

    // Get diagnosis function
    function getDiagnosis() {
        resultsContainer.style.display = "block";
        let selectedSymptoms = [...document.querySelectorAll(".symptom-container")].map(container => {
            return {
                symptom: container.dataset.symptom,
                severity: container.querySelector(".severity-select").value
            };
        });

        if (selectedSymptoms.length === 0) {
            resultsContainer.innerHTML = '<p>Please select at least one symptom.</p>';
            return;
        }

        selectedSymptoms.forEach(symptom => {
            /* if () {
                possibleCauses.push();
            }
            if () {
                recommendedRepairs.push();
            } */
        });

        /**
         * Compute most likely causes with percentage normalization
         * @param {Array} selectedSymptoms - List of { symptom, severity }
         * @returns {Array} Array of top 5 causes with percentages
         */
        function computeLikelyCauses(selectedSymptoms) {
            const causeScores = Array(data.causes.length).fill(0);
            let checkCount = 0;

            selectedSymptoms.forEach(({ symptom }) => {
                const symptomIndex = data.symptoms.indexOf(symptom);
                if (symptomIndex !== -1) {
                    checkCount++;
                    for (let i = 0; i < data.causes.length; i++) {
                        causeScores[i] += fullMatrix[i][symptomIndex]; // 0 or 1
                    }
                }
            });

            const percentages = causeScores.map(score =>
                checkCount > 0 ? Math.round((score / checkCount) * 100) : 0
            );

            return data.causes
                .map((cause, i) => ({ cause, percentage: percentages[i] }))
                .sort((a, b) => b.percentage - a.percentage)
                .slice(0, 5);
        }


        /**
         * Compute best repair strategies with percentage normalization and duration
         * @param {Array} selectedSymptoms - List of { symptom, severity }
         * @returns {Array} Array of top 5 repair strategies with percentages and estimated duration
         */
        function computeBestRepairs(selectedSymptoms) {
            const repairScores = Array(data.repairStrategies.length).fill(0);
            let checkCount = 0;

            selectedSymptoms.forEach(({ symptom, severity }) => {
                const symptomIndex = data.symptoms.indexOf(symptom);
                const matrix = fullTotalMatrix[severity];

                if (symptomIndex !== -1 && matrix) {
                    checkCount++;
                    for (let i = 0; i < data.repairStrategies.length; i++) {
                        repairScores[i] += matrix[i][symptomIndex]; // numeric weight
                    }
                }
            });

            const percentages = repairScores.map(score =>
                checkCount > 0 ? Math.round((score / checkCount) * 100) : 0
            );

            return data.repairStrategies
                .map((repair, i) => ({
                    repair,
                    percentage: percentages[i],
                    duration: data.timeSync[i] // TimeSync is mapped by index
                }))
                .sort((a, b) => b.percentage - a.percentage)
                .slice(0, 5);
        }

        /**
         * Determine traditional repair strategy based on most likely causes
         * @param {Array} selectedSymptoms - List of { symptom, severity }
         * @returns {String} Traditional strategy based on the most likely causes
         */
        function getTraditionalRepair(selectedSymptoms) {
            let likelyCauses = computeLikelyCauses(selectedSymptoms); // Get causes
            let causeIndices = likelyCauses.map(c => data.causes.indexOf(c.cause));
            let maxCheck = new Set();
            let finalTradStrats = [];

            causeIndices.forEach(index => {
                let tradStrat = "";
                let maxCheckNo = 0;

                if (index < 3) {
                    tradStrat = "No Available Treatment";
                    maxCheckNo = 1;
                } else if (index < 17) {
                    tradStrat = "Avoiding Similar Mistakes During Maintenance And Reconstruction";
                    maxCheckNo = 2;
                } else if (index === 17) {
                    tradStrat = "Designing Lanes For Different Vehicle Or Improve Traffic Allocation";
                    maxCheckNo = 3;
                } else if (index === 18) {
                    tradStrat = "Improving Traffic Allocation";
                    maxCheckNo = 4;
                } else if (index === 19) {
                    tradStrat = "Implementing Speed Reduction Measures";
                    maxCheckNo = 5;
                } else if (index < 22) {
                    tradStrat = "Draining Surface Water";
                    maxCheckNo = 6;
                } else {
                    tradStrat = "Repairing Surrounding Devices";
                    maxCheckNo = 7;
                }

                // Ensure no duplicates
                if (!maxCheck.has(maxCheckNo)) {
                    maxCheck.add(maxCheckNo);
                    finalTradStrats.push(tradStrat);
                }
            });

            return finalTradStrats.join(" or ");
        }

        resultsContainer.innerHTML = "<h3>Possible Causes</h3>";
        const possibleCauses = computeLikelyCauses(selectedSymptoms);
        possibleCauses.forEach(item => {
            const div = document.createElement("div");
            div.innerHTML = `<strong>${item.cause}</strong>: ${item.percentage}%`;
            resultsContainer.appendChild(div);
        });

        resultsContainer.innerHTML += "<h3>Recommended Repairs</h3>";
        const recommendedRepairs = computeBestRepairs(selectedSymptoms);
        recommendedRepairs.forEach(item => {
            const div = document.createElement("div");
            div.innerHTML = `<strong>${item.repair}</strong>: ${item.percentage}% (Estimated Repair Duration: ${item.duration} years)`;
            resultsContainer.appendChild(div);
        });

        resultsContainer.innerHTML += "<h3>Traditional Repair Strategy</h3>";
        const traditional = getTraditionalRepair(selectedSymptoms);
        const tradDiv = document.createElement("div");
        tradDiv.innerHTML = `<strong>${traditional}</strong>`;
        resultsContainer.appendChild(tradDiv);
    }
    diagnoseButton.addEventListener("click", getDiagnosis);
});