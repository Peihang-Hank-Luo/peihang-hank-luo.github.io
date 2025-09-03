function parseCSVLine(line) {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i+1] === '"') {
                cur += '"';
                i++; // skip escaped quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === ',' && !inQuotes) {
            result.push(cur);
            cur = '';
        } else {
            cur += ch;
        }
    }
    result.push(cur);
    return result;
}

async function loadCSV(path) {
    let text;
    if (typeof window === 'undefined') {
        const fs = require('fs');
        text = fs.readFileSync(path, 'utf8');
    } else {
        const resp = await fetch(path);
        text = await resp.text();
    }
    const [header, ...lines] = text.trim().split(/\r?\n/);
    const keys = parseCSVLine(header).map(k => k.trim());
    return lines.map(line => {
        const values = parseCSVLine(line).map(v => v.trim());
        const obj = {};
        keys.forEach((k, i) => {
            obj[k] = values[i] !== undefined ? values[i] : '';
        });
        return obj;
    });
}

function unique(arr) {
    return Array.from(new Set(arr));
}

async function loadAllData(basePath = '../assets/csv/') {
    const [causeTreatment, defectCause, defectRepair, repairStrats] = await Promise.all([
        loadCSV(basePath + 'CauseTreatment.csv'),
        loadCSV(basePath + 'DefectCause.csv'),
        loadCSV(basePath + 'DefectRepair.csv'),
        loadCSV(basePath + 'RepairStrats.csv')
    ]);

    const symptoms = unique(defectRepair.map(r => r.Defect));

    // Build the canonical cause universe from CauseTreatment by CauseID
    const causeRows = [];
    const seenCause = new Set();
    for (const r of causeTreatment) {
    const id = Number(r.CauseID);
    if (!Number.isFinite(id)) continue;
    if (seenCause.has(id)) continue;
    seenCause.add(id);
    causeRows.push({
        id,
        name: r.Cause,
        group: r['Cause category']
    });
    }
    const UniqueCauseID     = causeRows.map(r => r.id);
    const UniqueCause       = causeRows.map(r => r.name);
    const UniqueCauseStrat  = causeRows.map(r => r.group);
    const causeIndexByID    = new Map(UniqueCauseID.map((id,i)=>[id,i]));

    // CauseAmount (D x C) using CauseID
    const nSymptoms = symptoms.length;
    const CauseAmount = Array.from({length: nSymptoms}, () => new Array(UniqueCauseID.length).fill(0));

    defectCause.forEach(r => {
    const d = symptoms.indexOf(r.Defect);
    const cIdx = causeIndexByID.get(Number(r['Cause ID'])); // CSV must have a cause ID column
    if (d > -1 && cIdx != null) CauseAmount[d][cIdx] = 1;
    });

    // Keep `fullMatrix` for back-compat if other code expects it (maps symptom->cause by *this* canonical order):
    const fullMatrix = CauseAmount;

    // TreatmentAmount (T x C) from CauseTreatment
    const treatmentRows = [];
    const seenTreat = new Set();
    for (const r of causeTreatment) {
    const tID = String(r.TreatmentID);     // stable ID
    if (!tID) continue;
    if (seenTreat.has(tID)) continue;
    seenTreat.add(tID);
    treatmentRows.push({ id: tID, name: r.Treatment });
    }
    const UniqueTreatmentID   = treatmentRows.map(r => r.id);
    const UniqueTreatment     = treatmentRows.map(r => r.name);
    const treatmentIndexByID  = new Map(UniqueTreatmentID.map((id,i)=>[id,i]));

    const TreatmentAmount = Array.from({length: UniqueTreatmentID.length}, () => new Array(UniqueCauseID.length).fill(0));

    causeTreatment.forEach(r => {
    const cIdx = causeIndexByID.get(Number(r.CauseID));
    const tIdx = treatmentIndexByID.get(String(r.TreatmentID));
    if (cIdx != null && tIdx != null) TreatmentAmount[tIdx][cIdx] = 1;
    });

    const repairStrategies = [];
    const repairStrategyGroups = [];
    const costMatrixNamed = [];
    const groupValues = [];
    const roadTypes = [];
    const lifeMean = [];
    const lifeMin = [];
    const lifeMax = [];
    const lifeRange = [];
    const repairById = {};
    const repairNameToIndex = {};

    repairStrats.forEach(r => {
        repairById[r.id] = r;
        if (repairNameToIndex[r.Name] === undefined) {
            const idx = repairStrategies.length;
            repairNameToIndex[r.Name] = idx;
            repairStrategies.push(r.Name);
            repairStrategyGroups.push(r.Category);
            costMatrixNamed.push(r.Cost);
            groupValues.push(r['When (# defects)'] || '');
            roadTypes.push(r['Where? (road type)'] || '');
            const mn = parseFloat(r.LifetimeMean);
            const mnMin = parseFloat(r.LifetimeMinYears);
            const mnMax = parseFloat(r.LifetimeMaxYears);
            lifeMean.push(isNaN(mn) ? -100 : mn);
            lifeMin.push(isNaN(mnMin) ? -100 : mnMin);
            lifeMax.push(isNaN(mnMax) ? -100 : mnMax);
            lifeRange.push((!isNaN(mnMin) && !isNaN(mnMax)) ? (mnMax - mnMin) : -100);
        }
    });

    function costWeight(c) {
        const lc = (c || '').toLowerCase();
        if (lc.includes('low')) return 0.6;
        if (lc.includes('medium/high')) return 0.1;
        if (lc.includes('medium')) return 0.3;
        if (lc.includes('high')) return 0.1;
        return 0;
    }
    function costRankVal(c) {
        const lc = (c || '').toLowerCase();
        if (lc.includes('low')) return 1;
        if (lc.includes('medium/high')) return 3;
        if (lc.includes('medium')) return 2;
        if (lc.includes('high')) return 3;
        return 0;
    }

    const costMatrix = costMatrixNamed.map(costWeight);
    const costRank = costMatrixNamed.map(costRankVal);

    const severityIndex = { 'Very Low':0,'Low':1,'Medium':2,'High':3,'Unknown':4 };
    const severities = Object.keys(severityIndex);
    const materials = ['asphalt','concrete'];
    const groups = ['Individual','Widespread'];

    const nRepairs = repairStrategies.length;

    const repairMaterialMask = Array.from({length:nRepairs},()=>[0,0]);
    const repairGroupMask = Array.from({length:nRepairs},()=>[
        Array(5).fill(0),
        Array(5).fill(0)
    ]);

    repairStrategies.forEach((name, idx) => {
        const road = (roadTypes[idx] || '').toLowerCase();
        if (/concrete/.test(road) || /both/.test(road)) repairMaterialMask[idx][1] = 1;
        if (/asphalt/.test(road) || /both/.test(road)) repairMaterialMask[idx][0] = 1;

        const gv = (groupValues[idx] || '').toLowerCase();
        if (gv.includes('both')) {
            repairGroupMask[idx][0].fill(1,0,4);
            repairGroupMask[idx][1].fill(1,0,4);
        }
        if (gv.includes('Individual')) {
            repairGroupMask[idx][0].fill(1,0,4);
        }
        if (gv.includes('Widespread')) {
            if (gv.includes('very low')) repairGroupMask[idx][1][0] = 1;
            else if (gv.includes('low')) repairGroupMask[idx][1][1] = 1;
            else if (gv.includes('medium')) repairGroupMask[idx][1][2] = 1;
            else if (gv.includes('high') || gv.includes('severe')) repairGroupMask[idx][1][3] = 1;
            else repairGroupMask[idx][1].fill(1,0,4);
        }
    });

    repairGroupMask.forEach(mask => {
        for (let g=0; g<2; g++) {
            mask[g][4] = 0.05*mask[g][0] + 0.10*mask[g][1] + 0.30*mask[g][2] + 0.55*mask[g][3];
        }
    });

    const repairDefectMask = Array.from({length:5},()=>Array.from({length:nSymptoms},()=>Array(nRepairs).fill(0)));
    defectRepair.forEach(row => {
        const d = symptoms.indexOf(row.Defect);
        const sIdx = Number(row.Severity); // 0..3 in CSV (Very Low..High)
        const rInfo = repairById[row.RepairStrat];
        if (d === -1 || !rInfo || Number.isNaN(sIdx) || sIdx < 0 || sIdx > 3) return;

        const ridx = repairNameToIndex[rInfo.Name];
        if (ridx === undefined) return;

        repairDefectMask[sIdx][d][ridx] = 1;
    });

    for (let d=0; d<nSymptoms; d++) {
        for (let r=0; r<nRepairs; r++) {
            repairDefectMask[4][d][r] = (repairDefectMask[0][d][r]||repairDefectMask[1][d][r]||repairDefectMask[2][d][r]||repairDefectMask[3][d][r]) ? 1 : 0;
        }
    }

    const fullTotalMatrix = {};
    materials.forEach((mat, mi) => {
        fullTotalMatrix[mat] = {};
        groups.forEach((g, gi) => {
            fullTotalMatrix[mat][g] = {};
            severities.forEach((sev, si) => {
                const matArr = Array.from({length:nSymptoms},()=>Array(nRepairs).fill(0));
                for (let d=0; d<nSymptoms; d++) {
                    for (let r=0; r<nRepairs; r++) {
                        if (repairMaterialMask[r][mi] && repairGroupMask[r][gi][si] && repairDefectMask[si][d][r]) {
                            matArr[d][r] = 1;
                        }
                    }
                }
                fullTotalMatrix[mat][g][sev] = matArr;
            });
        });
    });

    // Build 5D DefectAmount, CostDefectAmount, CostLifeDefectAmount
    // Dimensions: [material:2][group:2][severity:5][symptom:nSymptoms][repair:nRepairs]

    function make5D(fillVal=0) {
    return Array.from({length:2}, () => // material
        Array.from({length:2}, () =>     // group (Individual/Widespread)
        Array.from({length:5}, () =>   // severity (Very Low..High, Unknown)
            Array.from({length:nSymptoms}, () => Array(nRepairs).fill(fillVal))
        )
        )
    );
    }

    // Base presence by group/severity (independent of symptom and material)
    const DefectAmount       = make5D(0);
    const CostDefectAmount   = make5D(0);
    const CostLifeDefectAmount = make5D(0);

    for (let r = 0; r < nRepairs; r++) {
    for (let g = 0; g < 2; g++) {
        for (let s = 0; s < 5; s++) {
        const present = repairGroupMask[r][g][s] ? 1 : 0; // 0/1
        if (!present) continue;

        const costW  = costMatrix[r];      // 0.6, 0.3, 0.1, ...
        const lifeMn = lifeMean[r];        // years or -100

        // Repeat across both materials, and across ALL symptoms
        for (let m = 0; m < 2; m++) {
            for (let d = 0; d < nSymptoms; d++) {
            DefectAmount[m][g][s][d][r]       = 1;
            CostDefectAmount[m][g][s][d][r]   = 1 * costW;
            CostLifeDefectAmount[m][g][s][d][r] = 1 * costW * lifeMn;
            }
        }
        }
    }
    }

    // Blend the Unknown (index 4) severity as weighted combination of 0..3
    const blend = [0.05, 0.10, 0.30, 0.55];
    for (let m = 0; m < 2; m++) {
    for (let g = 0; g < 2; g++) {
        for (let d = 0; d < nSymptoms; d++) {
        for (let r = 0; r < nRepairs; r++) {
            let v = 0, vc = 0, vcl = 0;
            for (let s = 0; s < 4; s++) {
            v   += blend[s] * DefectAmount[m][g][s][d][r];
            vc  += blend[s] * CostDefectAmount[m][g][s][d][r];
            vcl += blend[s] * CostLifeDefectAmount[m][g][s][d][r];
            }
            DefectAmount[m][g][4][d][r]        = v;
            CostDefectAmount[m][g][4][d][r]    = vc;
            CostLifeDefectAmount[m][g][4][d][r]= vcl;
        }
        }
    }
    }

    // MaterialCheck: expand your per-repair material mask across group/severity/symptom
    const MaterialCheck = make5D(0);
    for (let r = 0; r < nRepairs; r++) {
    for (let m = 0; m < 2; m++) {
        if (!repairMaterialMask[r][m]) continue;
        for (let g = 0; g < 2; g++) {
        for (let s = 0; s < 5; s++) {
            for (let d = 0; d < nSymptoms; d++) {
            MaterialCheck[m][g][s][d][r] = 1;
            }
        }
        }
    }
    }

    // RepairMatrix: expand your repairDefectMask into 5D (no material/group gating here)
    const RepairMatrix = make5D(0);
    for (let s = 0; s < 5; s++) {
    for (let d = 0; d < nSymptoms; d++) {
        for (let r = 0; r < nRepairs; r++) {
        if (!repairDefectMask[s][d][r]) continue;
        for (let m = 0; m < 2; m++) {
            for (let g = 0; g < 2; g++) {
            RepairMatrix[m][g][s][d][r] = 1;
            }
        }
        }
    }
    }

    // Final gated matrices (elementwise product). These mirror MATLAB’s TestTemp.*RepairMatrix.
    function mul5D(A,B) {
    const out = make5D(0);
    for (let m = 0; m < 2; m++)
        for (let g = 0; g < 2; g++)
        for (let s = 0; s < 5; s++)
            for (let d = 0; d < nSymptoms; d++)
            for (let r = 0; r < nRepairs; r++)
                out[m][g][s][d][r] = A[m][g][s][d][r] * B[m][g][s][d][r];
    return out;
    }

    const FullRepairMatrix         = mul5D(mul5D(MaterialCheck, DefectAmount),       RepairMatrix);
    const FullRepairMatrixCost     = mul5D(mul5D(MaterialCheck, CostDefectAmount),   RepairMatrix);
    const FullRepairMatrixCostLife = mul5D(mul5D(MaterialCheck, CostLifeDefectAmount), RepairMatrix);

    defectCause.forEach(r => {
        const d = symptoms.indexOf(r.Defect);
        const c = causes.indexOf(r['Cause Name']);
        if (d>-1 && c>-1) fullMatrix[d][c] = 1;
    });

    return {
        data: {
            symptoms,
            // Causes/treatments
            UniqueCause, UniqueCauseStrat, UniqueCauseID,
            UniqueTreatment, UniqueTreatmentID,
            // Repairs
            repairStrategies,
            repairStrategyGroups,
            timeSync: lifeMean
        },
        // Defect→Cause
        fullMatrix: CauseAmount,   // keep legacy name if other code relies on it
        CauseAmount,
        TreatmentAmount,

        // Final 5D tensors
        FullRepairMatrix,
        FullRepairMatrixCost,
        FullRepairMatrixCostLife,

        // If you still want your older object-of-2D-matrices, you can optionally keep it:
        // fullTotalMatrix,

        // Scalars/vectors
        costMatrix, costMatrixNamed, costRank,
        lifeMean, lifeRange
    };
}

if (typeof window !== 'undefined') {
    window.loadAllData = loadAllData;
}
if (typeof module !== 'undefined') {
    module.exports = { loadAllData };
}
