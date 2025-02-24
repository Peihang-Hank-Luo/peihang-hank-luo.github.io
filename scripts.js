// Function to load an external file into an element
function loadComponent(id, file) {
    fetch(file)
        .then(response => response.text())
        .then(data => document.getElementById(id).innerHTML = data)
        .catch(error => console.error('Error loading component:', error));
}

document.addEventListener("DOMContentLoaded", function () {
    const data = {
        symptoms: ["Pothole", "Cracking", "Faded Markings", "Rutting", "Drainage Issues"],
        diseases: {
            "Pothole": "Surface degradation due to water infiltration and traffic load.",
            "Cracking": "Structural fatigue or weather-induced stress.",
            "Faded Markings": "Paint degradation due to exposure and wear.",
            "Rutting": "Depressions caused by heavy traffic loads.",
            "Drainage Issues": "Water pooling due to improper slope or clogged drains."
        },
        repairStrategies: {
            "Pothole": "Cold patch repair or full-depth asphalt replacement.",
            "Cracking": "Crack sealing or resurfacing.",
            "Faded Markings": "Repainting using thermoplastic paint.",
            "Rutting": "Milling and resurfacing to restore smoothness.",
            "Drainage Issues": "Improving drainage design and clearing blockages."
        }
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
            let chip = document.createElement("span");
            chip.className = "symptom-chip";
            chip.textContent = symptom;
            chip.onclick = () => chip.remove();
            selectedSymptoms.appendChild(chip);
        }
    }

    // Get diagnosis function
    function getDiagnosis() {
        resultsContainer.style.display = "block";
        let selectedSymptoms = [...document.querySelectorAll(".symptom-chip")].map(el => el.textContent);
        if (selectedSymptoms.length === 0) {
            resultsContainer.innerHTML = '<p>Please select at least one symptom.</p>';
            return;
        }

        let possibleDiseases = [];
        let recommendedRepairs = [];

        selectedSymptoms.forEach(symptom => {
            if (data.diseases[symptom]) {
                possibleDiseases.push({ name: symptom, description: data.diseases[symptom] });
            }
            if (data.repairStrategies[symptom]) {
                recommendedRepairs.push({ name: symptom, description: data.repairStrategies[symptom] });
            }
        });

        resultsContainer.innerHTML = '<h3>Possible Issues</h3>';
        possibleDiseases.forEach(disease => {
            let div = document.createElement("div");
            div.innerHTML = `<strong>${disease.name}:</strong> ${disease.description}`;
            resultsContainer.appendChild(div);
        });

        resultsContainer.innerHTML += `<h3>Recommended Repairs</h3>`;
        recommendedRepairs.forEach(strategy => {
            let div = document.createElement("div");
            div.innerHTML = `<strong>${strategy.name}:</strong> ${strategy.description}`;
            resultsContainer.appendChild(div);
        });
    }
    diagnoseButton.addEventListener("click", getDiagnosis);
});

// Load header and footer
document.addEventListener("DOMContentLoaded", function() {
    loadComponent("header", "includes/header.html");
    loadComponent("footer", "includes/footer.html");
});
