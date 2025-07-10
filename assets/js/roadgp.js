document.addEventListener("DOMContentLoaded", async function () {
    const loaded = await loadAllData('../assets/csv/');
    const data = loaded.data;
    const fullMatrix = loaded.fullMatrix;
    const fullTotalMatrix = loaded.fullTotalMatrix;
    const costMatrix = loaded.costMatrix;       // weighting values
    const costMatrixNamed = loaded.costMatrixNamed; // descriptive strings
    const costRank = loaded.costRank;           // 1=low 2=medium 3=high
    const lifeMean = loaded.lifeMean;
    const lifeRange = loaded.lifeRange;

    // Map of road asset to the defects belonging to that asset. The
    // defect names must exactly match those loaded from the CSV files
    // otherwise the filter will fail to show/hide them correctly.
    const regionToSymptoms = {
        pavement: [
            "Transverse",
            "Longitudinal",
            "Edge",
            "Block",
            "Alligator",
            "Potholes",
            "Patches",
            "Shoving",
            "Rutting",
            "Distortion",
            "Raveling",
            "Bleeding",
            "Spalling",
            "Surface irregularities",
            "Slab rocking",
            "Stepping"
        ],
        markings: [
            "Material fault",
            "Skidding",
            "Poor retroreflectivity",
            "Poor luminance",
            "Stud defects",
            "Stud retroreflectivity"
        ],
        gully: [
            "Blockage (gully)",
            "Flooding and standing water"
        ]
    };

    const symptomButtons = document.getElementById("symptom-buttons");
    const selectedSymptoms = document.getElementById("selected-symptoms");
    const input = document.getElementById("symptom-input");
    const autocompleteList = document.getElementById("autocomplete-list");
    const resultsContainer = document.getElementById("results");
    const diagnoseButton = document.getElementById("diagnose-button");
    const roadLengthInput = document.getElementById("road-length-input");

    const seenEntries = new Set();     // symptom|severity as key

    // Populate symptom buttons for quick selection  
    data.symptoms.forEach(symptom => {
        let button = document.createElement("div");
        button.className = "symptom-button";
        button.textContent = symptom;
        button.onclick = () => addSymptom(symptom);
        symptomButtons.appendChild(button);
    });

    filterSymptomButtons([]);  // hides all until region is chosen

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
    // function addSymptom(symptom) {
    //     if (![...selectedSymptoms.children].some(el => el.textContent === symptom)) {
    //         let container = document.createElement("div");
    //         container.className = "symptom-container";
    //         container.dataset.symptom = symptom;

    //         let chip = document.createElement("span");
    //         chip.className = "symptom-chip";
    //         chip.textContent = symptom;
            
    //         let severitySelect = document.createElement("select");
    //         severitySelect.className = "severity-select";
    //         ["Very Low", "Low", "Medium", "High", "Unknown"].forEach(level => {
    //             let option = document.createElement("option");
    //             option.value = level;
    //             option.textContent = level;
    //             severitySelect.appendChild(option);
    //         });

    //         severitySelect.addEventListener("change", ev => {
    //             const key = symptom + "|" + ev.target.value;
    //             if (seenEntries.has(key)) {
    //                 alert("That symptom at this severity is already added.");
    //                 // roll back to “Unknown” (or whatever you prefer)
    //                 ev.target.value = "Unknown";
    //             } else {
    //                 // remove any prior key for this symptom
    //                 Array.from(seenEntries)
    //                 .filter(k => k.startsWith(symptom + "|"))
    //                 .forEach(k => seenEntries.delete(k));
    //                 // record the new pair
    //                 seenEntries.add(key);
    //             }
    //         });

    //         // Quantity input field
    //         let quantityInput = document.createElement("input");
    //         quantityInput.type = "number";
    //         quantityInput.className = "quantity-input";
    //         quantityInput.placeholder = "Quantity";
    //         quantityInput.min = 1;

    //         let removeButton = document.createElement("button");
    //         removeButton.className = "remove-button";
    //         removeButton.textContent = "×";
    //         removeButton.onclick = () => container.remove();
            
    //         container.appendChild(chip);
    //         container.appendChild(severitySelect);
    //         container.appendChild(quantityInput);
    //         container.appendChild(removeButton);
    //         selectedSymptoms.appendChild(container);
    //     }
    // }

    function addSymptom(symptom) {
        if ([...selectedSymptoms.children].some(el => el.dataset.symptom === symptom)) return;
    
        const container = document.createElement("div");
        container.className = "symptom-container";
        container.dataset.symptom = symptom;
    
        // Symptom label
        const chip = document.createElement("span");
        chip.className = "symptom-chip";
        chip.textContent = symptom;
    
        // Create a row of quantity inputs for each severity
        // ["Very Low", "Low", "Medium", "High", "Unknown"].forEach(level => {
        //     const row = document.createElement("div");
        //     row.className = "severity-row";
    
        //     const label = document.createElement("label");
        //     label.textContent = level;
        //     label.className = "severity-label";
    
        //     const input = document.createElement("input");
        //     input.type = "number";
        //     input.min = 0;
        //     input.value = 0;
        //     input.className = "severity-quantity";
        //     input.dataset.severity = level;
        //     input.placeholder = "0";
    
        //     row.appendChild(label);
        //     row.appendChild(input);
        //     container.appendChild(row);
        // });

        // NEW: vertical grid of 5 severities
        const severities = ["Very Low","Low","Medium","High","Unknown"];
        const grid = document.createElement("div");
        grid.className = "severity-grid";

        severities.forEach(level => {
            const row = document.createElement("div");
            row.className = "severity-row";

            const label = document.createElement("label");
            label.textContent = level;
            label.style.flex = "1";           // label takes only needed width
            label.style.whiteSpace = "nowrap";

            const input = document.createElement("input");
            input.type = "number";
            input.min = "0";
            input.placeholder = "Qty";
            input.className = "severity-quantity";
            input.dataset.severity = level;   // so analyze(...) knows which

            row.append(label, input);
            grid.append(row);
        });
    
        // Remove button
        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-button";
        removeBtn.textContent = "×";
        removeBtn.onclick = () => container.remove();
    
        // assemble
        container.append(chip, grid, removeBtn);
        selectedSymptoms.appendChild(container);
    }

    function filterSymptomButtons(allowedList) {
        document.querySelectorAll(".symptom-button").forEach(btn => {
          const name = btn.textContent;
          btn.style.display = allowedList.includes(name)
            ? "inline-block"
            : "none";
        });
    }

    // ————— Hook up the SVG click-zones —————
    let currentRegion = null;
    let currentList = [];
    document
    .querySelectorAll("#road-selector svg g[id]")
    .forEach(regionEl => {
        regionEl.style.cursor = "pointer";
        regionEl.addEventListener("click", () => {
        const region   = regionEl.id;    // "markings", "gullies", etc.
        const list     = regionToSymptoms[region] || [];
        currentRegion  = region;
        currentList    = list;

        // 1) Clear any previously selected symptom chips
        // selectedSymptoms.innerHTML = "";

        // 2) Seed the UI with only that region’s defects
        // list.forEach(sym => addSymptom(sym));

        // 3) Optionally highlight the clicked region
        document
            .querySelectorAll("#road-selector svg g[id]")
            .forEach(el => el.classList.remove("active"));
        regionEl.classList.add("active");

        // 4) Filter your button grid (if you still have that)
        filterSymptomButtons(list);
        });
    });


    const step2Btn = document.getElementById('to-step-2');
    if (step2Btn) {
        step2Btn.addEventListener('click', () => {
            filterSymptomButtons(currentList);
        });
    }

    function getSelectedMaterial() {
        const mat = document.querySelector('input[name="road-material"]:checked');
        return mat ? mat.value.toLowerCase() : 'asphalt';
    }

    function getRepairVector(material, symptomIndex, severity, quantity) {
        let roadLen = parseFloat(document.getElementById("road-length-input").value);

        if (isNaN(roadLen) || roadLen <= 0) {
            showWarning("Invalid road length. Using default of 100 meters.");
            roadLen = 100;
        }

        const threshold = roadLen / 2;
        const mode = (quantity >= threshold) ? "Group" : "Individual";
        const matrix = fullTotalMatrix[material][mode][severity];
        return matrix[symptomIndex];  // returns an array of repair-weights
    }

    function analyze(selected, material) {
        const causeScores  = Array(data.causes.length).fill(0);
        const repairScores = Array(data.repairStrategies.length).fill(0);

        // FinalTotalCheck analogue – number of unique defects recorded
        const seenDefects = new Set();
        // CheckCount analogue – total number of defect/severity entries
        let entryCount = 0;

        selected.forEach(({ symptomIndex, severity, quantity }) => {
          entryCount++;

          // 1) accumulate causes only once per unique defect
          if (!seenDefects.has(symptomIndex)) {
            seenDefects.add(symptomIndex);
            fullMatrix[symptomIndex]
              .forEach((w, ci) => causeScores[ci] += w);
          }

          // 2) accumulate repairs for every entry
          const repVec = getRepairVector(material, symptomIndex, severity, quantity);
          repVec.forEach((w, ri) => repairScores[ri] += w);
        });

        const defectCount = seenDefects.size;  // unique defect count

        // percentages
        const causePct  = causeScores.map(s => defectCount ? Math.round(100 * s/defectCount) : 0);
        const repairPct = repairScores.map(s => entryCount ? Math.round(100 * s/entryCount) : 0);
      
        // relative certainties
        const maxCausePct  = Math.max(...causePct);
        const maxRepairPct = Math.max(...repairPct);
        const causeRel     = causePct .map(p => +(p/maxCausePct).toFixed(2));
        const repairRel    = repairPct.map(p => +(p/maxRepairPct).toFixed(2));
      
        return { causeScores, causePct, causeRel, repairScores, repairPct, repairRel };
    }

    /**
     * Take your array of { symptom, severity, quantity } entries,
     * sum up cause- and repair-scores exactly once per defect,
     * then divide by the total defect count to get 0–100%.
     */
    // function analyze(selectedSymptoms) {
    //     const nDefects = selectedSymptoms.length;
    //     const causeScores  = Array(data.causes.length).fill(0);
    //     const repairScores = Array(data.repairStrategies.length).fill(0);
    
    //     selectedSymptoms.forEach(({ symptom, severity, quantity }) => {
    //         const si = data.symptoms.indexOf(symptom);
    //         if (si === -1) return;
        
    //         // 1) Cause accumulation (Full matrix is 22×38: symptoms→causes)
    //         fullMatrix[si].forEach((v, ci) => {
    //             causeScores[ci] += v;
    //         });
        
    //         // 2) Repair accumulation (FullTotal is 22×29 per severity)
    //         const repaired = getRepairVector(si, severity, quantity);
    //         repaired.forEach((v, ri) => {
    //             repairScores[ri] += v;
    //         });
    //     });

    //     // 3) Percentages = round(100 * (score / #defects))
    //     const causePct  = causeScores .map(x => nDefects>0 ? Math.round((x/nDefects)*100) : 0);
    //     const repairPct = repairScores.map(x => nDefects>0 ? Math.round((x/nDefects)*100) : 0);
    
    //     // 4) Relative certainties (0–1 floats)
    //     const maxCause  = Math.max(...causePct, 1);
    //     const maxRepair = Math.max(...repairPct, 1);
    //     const causeRel  = causePct .map(x => Math.round((x/maxCause) * 100) / 100);
    //     const repairRel = repairPct.map(x => Math.round((x/maxRepair) * 100) / 100);
    
    //     return { causeScores, causePct, causeRel, repairScores, repairPct, repairRel };
    // }

    function pickTop(results) {
        // Causes
        let topCauseIndices = results.causePct
          .map((p,i)=> p===Math.max(...results.causePct) ? i : -1)
          .filter(i=>i>=0);
      
        // Repairs: first highest %
        let topRepIdx = results.repairPct
          .map((p,i)=> p===Math.max(...results.repairPct) ? i : -1)
          .filter(i=>i>=0);
      
        // then cheapest
        const costVals = topRepIdx.map(i=> costRank[i]);
        const minCost  = Math.min(...costVals);
        topRepIdx = topRepIdx.filter(i=> costRank[i] === minCost);
      
        // then longest life
        const lifeVals = topRepIdx.map(i=> lifeMean[i]);
        const maxLife  = Math.max(...lifeVals);
        topRepIdx = topRepIdx.filter(i=> lifeMean[i] === maxLife);

        // then smallest lifespan range
        const rangeVals = topRepIdx.map(i=> Math.abs(lifeRange[i]));
        const minRange  = Math.min(...rangeVals);
        topRepIdx = topRepIdx.filter(i=> Math.abs(lifeRange[i]) === minRange);
      
        return { topCauseIndices, topRepIdx };
    }

    /**
     * @param {number[]} topCauseIndices
     *   an array of cause-indices sorted by descending likelihood
     * @returns {string}
     *   a human-readable “traditionally treated by …” phrase
     */
    function getTraditionalRepair(topCauseIndices) {
        const used = new Set();
        const lines = [];
    
        topCauseIndices.forEach(ci => {
        let strat;
        // map each cause index into one of your TraditionalStrategies:
        if (ci < 3) {
            strat = "No Available Treatment";
        } else if (ci < 17) {
            strat = "Avoid Similar Mistakes During Maintenance And Reconstruction";
        } else if (ci === 17) {
            strat = "Design Lanes For Different Vehicle Or Improve Traffic Allocation";
        } else if (ci === 18) {
            strat = "Improve Traffic Allocation";
        } else if (ci === 19) {
            strat = "Implement Speed Reduction Measures";
        } else if (ci < 22) {
            strat = "Drain Surface Water";
        } else {
            strat = "Repair Surrounding Devices";
        }
    
        if (!used.has(strat)) {
            used.add(strat);
            lines.push(strat);
        }
        });
    
        return lines.join(" or ");
    }

    // function likelihoodPhrase(rel, secondRel=0) {
    //     const d = rel - secondRel;
    //     if (d <=0.1) return "somewhat likely to be caused by";
    //     if (d <=0.3) return "quite likely to be caused by";
    //     if (d <=0.5) return "very likely to be caused by";
    //     if (d <1)    return "incredibly likely to be caused by";
    //     return "certainly caused by";
    // }
    
    /**
     * @param {Array} selected    – the same array you build in getDiagnosis()
     * @param {Object} analysis   – result of analyze(selected)
     * @param {Object} picked     – result of pickTop(analysis)
     * @returns {String[]}        – four summary sentences
     */
    function makeSummary(selected, analysis, picked) {
        const { topCauseIndices, topRepIdx } = picked;
        const { causeRel, repairRel } = analysis;

        const uniqCauseRel = Array.from(new Set(causeRel))   // get unique
                                  .sort((a, b) => a - b);    // ascending

        let causePrefix = "This might be caused by ";        // default

        if (uniqCauseRel.length > 1) {
        const top    = uniqCauseRel[uniqCauseRel.length - 1];
        const second = uniqCauseRel[uniqCauseRel.length - 2];
        const diff   = top - second;

        if (diff <= 0.1) {
            causePrefix = "This is somewhat likely to be caused by ";
        } else if (diff <= 0.3) {
            causePrefix = "This is quite likely to be caused by ";
        } else if (diff <= 0.5) {
            causePrefix = "This is very likely to be caused by ";
        } else if (diff < 1) {
            causePrefix = "This is incredibly likely to be caused by ";
        } else if (diff === 1) {
            causePrefix = "This is certainly caused by ";
        }
        }

        // get the unique sorted relative certainties:
        const uniqRepairRel = Array.from(new Set(repairRel)).sort((a, b) => a - b);

        let repairPrefix = "This might be repaired by "; // default fallback

        if (uniqRepairRel.length > 1) {
        const top    = uniqRepairRel[uniqRepairRel.length - 1];
        const second = uniqRepairRel[uniqRepairRel.length - 2];
        const diff   = top - second;

        if (diff <= 0.1) {
            repairPrefix = "This is somewhat likely to be repaired by ";
        } else if (diff <= 0.3) {
            repairPrefix = "This is quite likely to be repaired by ";
        } else if (diff <= 0.5) {
            repairPrefix = "This is very likely to be repaired by ";
        } else if (diff < 1) {
            repairPrefix = "This is incredibly likely to be repaired by ";
        } else if (diff === 1) {
            repairPrefix = "This is certainly repaired by ";
        }
        }
    
        // 1) Causes sentence
        const causeNames = topCauseIndices.map(i=> data.causes[i]).join(" or ");
        const secondCauseRel = Math.max(...causeRel.filter((v,i)=>i!==topCauseIndices[0]));
        const sentence1 = `${causePrefix} ${causeNames}.`;
    
        // 2) Traditional strategies (just pick those mapped to your cause groups)
        const traditional   = getTraditionalRepair(topCauseIndices);
        const sentence2     = `Which is traditionally treated by ${traditional}.`;
    
        // 3) Repairs sentence
        const repNames     = topRepIdx.map(i=> data.repairStrategies[i]).join(" or ");
        const secondRepRel = Math.max(...repairRel.filter((v,i)=>i!==topRepIdx[0]));
        const sentence3 = `${repairPrefix} ${repNames}.`;
    
        // 4) Lifespan & cost
        const life = data.timeSync[topRepIdx[0]];
        const cost = costMatrixNamed[topRepIdx[0]];
        const sentence4 = `Those repairs will last ${life} years at ${cost} cost.`;
    
        return [ sentence1, sentence2 , sentence3, sentence4 ];
    }

    /**
     * title: string heading
     * data:  array of objects
     * columns: array of { key: objKey, label: columnHeader }
     */
    function renderTable(container, title, data, columns) {
        const h3 = document.createElement('h3');
        h3.textContent = title;
        container.appendChild(h3);
    
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        // header
        const thead = document.createElement('thead');
        const hr = document.createElement('tr');
        columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col.label;
        th.style.border = '1px solid #ccc';
        th.style.padding = '4px';
        th.style.textAlign = 'left';
        hr.appendChild(th);
        });
        thead.appendChild(hr);
        table.appendChild(thead);
    
        // body
        const tbody = document.createElement('tbody');
        data.forEach(row => {
        const tr = document.createElement('tr');
        columns.forEach(col => {
            const td = document.createElement('td');
            td.textContent = row[col.key];
            td.style.border = '1px solid #eee';
            td.style.padding = '4px';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
        });
        table.appendChild(tbody);
    
        container.appendChild(table);
    }

    // Get diagnosis function
    function getDiagnosis() {
        resultsContainer.style.display = "block";
        // let selectedSymptoms = [...document.querySelectorAll(".symptom-container")].map(container => {
        //     return {
        //         symptom: container.dataset.symptom,
        //         severity: container.querySelector(".severity-select").value,
        //         quantity: parseInt(container.querySelector(".quantity-input").value, 10) || 1 // Default to 1 if not provided
        //     };
        // });

        // const selected = Array.from(document.querySelectorAll(".symptom-container"))
        //     .map(c => ({
        //     symptomIndex: data.symptoms.indexOf(c.dataset.symptom),
        //     severity:      c.querySelector(".severity-select").value,
        //     quantity:      +c.querySelector(".quantity-input").value || 1
        //     }));

        // if (selected.length === 0) {
        //     resultsContainer.innerHTML = '<p>Please select at least one symptom.</p>';
        //     return;
        // }

        // Grab every symptom-container in the DOM
        const containers = document.querySelectorAll(".symptom-container");

        // Build our `entries` array of { symptomIndex, severity, quantity }
        const entries = Array.from(containers).flatMap(container => {
            const symptomName  = container.dataset.symptom;
            const symptomIndex = data.symptoms.indexOf(symptomName);
            // for each <input class="severity-quantity" data-severity="...">
            return Array.from(container.querySelectorAll(".severity-quantity"))
            .map(input => ({
                symptomIndex,
                severity: input.dataset.severity,
                quantity: parseInt(input.value, 10) || 0
            }))
            // filter out zero‐quantities
            .filter(({ quantity }) => quantity > 0);
        });

        if (entries.length === 0) {
            resultsContainer.innerHTML = '<p>Please specify at least one defect.</p>';
            return;
        }

        const showFull = document.getElementById('full-tables').checked;
        const material = getSelectedMaterial();
        const analysis = analyze(entries, material);
        const picked   = pickTop(analysis);
        // const summary  = makeSummary(selected, analysis, picked);
        const summary  = makeSummary(entries, analysis, picked);

        // render summary
        resultsContainer.innerHTML = summary.map(s => `<p>${s}</p>`).join('');

        resultsContainer.innerHTML += '';

        // Prepare full sorted arrays
        const fullCauseData = analysis.causePct
        .map((pct,i) => ({
            Cause: data.causes[i],
            Category: data.causeStrategyGroups[i],
            Percentage: pct + '%',
            relative: analysis.causeRel[i]
        }))
        .sort((a,b) => parseInt(b.Percentage) - parseInt(a.Percentage));

        const fullRepairData = analysis.repairPct
        .map((pct,i) => ({
            Repair: data.repairStrategies[i],
            Category: data.repairStrategyGroups[i],
            Percentage: pct + '%',
            'Rel. Certainty': analysis.repairRel[i],
            Lifespan: data.timeSync[i] + ' yrs',
            'Lifespan Range': lifeRange[i] + ' yrs',
            Cost: costMatrixNamed[i]
        }))
        .sort((a,b) => parseInt(b.Percentage) - parseInt(a.Percentage));

        // Slice for top-5 if needed
        const causeSlice  = showFull ? fullCauseData : fullCauseData.slice(0,5);
        const repairSlice = showFull ? fullRepairData : fullRepairData.slice(0,5);

        // Render them
        renderTable(resultsContainer,
                    showFull ? 'All Causes'    : 'Top 5 Causes',
                    causeSlice,
                    [
                    { key:'Cause',         label:'Cause' },
                    { key:'Category',      label:'Category' },
                    { key:'Percentage',    label:'Percentage' },
                    { key:'relative',      label:'Relative Certainty' },
                    ]);

        renderTable(resultsContainer,
                    showFull ? 'All Repairs'   : 'Top 5 Repairs',
                    repairSlice,
                    [
                    { key:'Repair',        label:'Repair' },
                    { key:'Category',      label:'Category' },
                    { key:'Percentage',    label:'Percentage' },
                    { key:'Rel. Certainty',label:'Relative Certainty' },
                    { key:'Lifespan',      label:'Lifespan' },
                    { key:'Lifespan Range',label:'Lifespan Range' },
                    { key:'Cost',          label:'Cost' },
                    ]);

        entries.forEach(symptom => {
            /* if () {
                possibleCauses.push();
            }
            if () {
                recommendedRepairs.push();
            } */
        });

        /**
         * Compute most likely causes with percentage normalization
         * @param {Array} selectedSymptoms - List of { symptom, severity, quantity }
         * @returns {Array} Array of top 5 causes with percentages
         */
        // function computeLikelyCauses(selectedSymptoms) {
        //     const causeScores = Array(data.causes.length).fill(0);
        //     let checkCount = 0;

        //     selectedSymptoms.forEach(({ symptom, severity, quantity }) => {
        //         const symptomIndex = data.symptoms.indexOf(symptom);
        //         if (symptomIndex !== -1) {
        //             checkCount++;
        //             for (let i = 0; i < data.causes.length; i++) {
        //                 causeScores[i] += fullMatrix[symptomIndex][i]; // 0 or 1
        //             }
        //         }
        //     });

        //     const percentages = causeScores.map(score =>
        //         checkCount > 0 ? Math.round((score / checkCount) * 100) : 0
        //     );

        //     return data.causes
        //         .map((cause, i) => ({ cause, percentage: percentages[i] }))
        //         .sort((a, b) => b.percentage - a.percentage)
        //         .slice(0, 5);
        // }


        /**
         * Compute best repair strategies with percentage normalization and duration
         * @param {Array} selectedSymptoms - List of { symptom, severity }
         * @returns {Array} Array of top 5 repair strategies with percentages and estimated duration
         */
        // function computeBestRepairs(selectedSymptoms) {
        //     const repairScores = Array(data.repairStrategies.length).fill(0);
        //     let checkCount = 0;

        //     selectedSymptoms.forEach(({ symptom, severity, quantity }) => {
        //         const symptomIndex = data.symptoms.indexOf(symptom);

        //         const matrix = fullTotalMatrix["Individual"][severity]; // Assuming "Individual" for now

        //         if (symptomIndex !== -1 && matrix) {
        //             checkCount++;
        //             for (let i = 0; i < data.repairStrategies.length; i++) {
        //                 // Multiply by quantity
        //                 repairScores[i] += matrix[symptomIndex][i] * quantity; // numeric weight
        //             }
        //         }
        //     });

        //     const percentages = repairScores.map(score =>
        //         checkCount > 0 ? Math.round((score / checkCount) * 100) : 0
        //     );

        //     return data.repairStrategies
        //         .map((repair, i) => ({
        //             repair,
        //             percentage: percentages[i],
        //             duration: data.timeSync[i] // TimeSync is mapped by index
        //         }))
        //         .sort((a, b) => b.percentage - a.percentage)
        //         .slice(0, 5);
        // }

        // resultsContainer.innerHTML = "<h3>Possible Causes</h3>";
        // const possibleCauses = computeLikelyCauses(selectedSymptoms);
        // possibleCauses.forEach(item => {
        //     const div = document.createElement("div");
        //     div.innerHTML = `<strong>${item.cause}</strong>: ${item.percentage}%`;
        //     resultsContainer.appendChild(div);
        // });

        // resultsContainer.innerHTML += "<h3>Recommended Repairs</h3>";
        // const recommendedRepairs = computeBestRepairs(selectedSymptoms);
        // recommendedRepairs.forEach(item => {
        //     const div = document.createElement("div");
        //     div.innerHTML = `<strong>${item.repair}</strong>: ${item.percentage}% (Estimated Repair Duration: ${item.duration} years)`;
        //     resultsContainer.appendChild(div);
        // });

        // resultsContainer.innerHTML += "<h3>Traditional Repair Strategy</h3>";
        // const traditional = getTraditionalRepair(selectedSymptoms);
        // const tradDiv = document.createElement("div");
        // tradDiv.innerHTML = `<strong>${traditional}</strong>`;
        // resultsContainer.appendChild(tradDiv);
    }
    diagnoseButton.addEventListener("click", getDiagnosis);
});