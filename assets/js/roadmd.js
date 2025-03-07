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
            "Repair Surrounding Devices"]
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
            ["Low", "Moderate", "High"].forEach(level => {
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

        let possibleCauses = [];
        let recommendedRepairs = [];

        selectedSymptoms.forEach(symptom => {
            /* if () {
                possibleCauses.push();
            }
            if () {
                recommendedRepairs.push();
            } */
        });

        resultsContainer.innerHTML = '<h3>Possible Causes</h3>';
        possibleCauses.forEach(cause => {
            let div = document.createElement("div");
            div.innerHTML = `<strong>${cause}</strong>`;
            resultsContainer.appendChild(div);
        });

        resultsContainer.innerHTML += `<h3>Recommended Repairs</h3>`;
        recommendedRepairs.forEach(strategy => {
            let div = document.createElement("div");
            div.innerHTML = `<strong>${strategy}</strong>`;
            resultsContainer.appendChild(div);
        });
    }
    diagnoseButton.addEventListener("click", getDiagnosis);
});