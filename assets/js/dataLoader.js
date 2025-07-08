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
    const causes = unique(defectCause.map(r => r['Cause Name']));
    const causeCategoryMap = {};
    causeTreatment.forEach(r => { causeCategoryMap[r.Cause] = r['Cause category']; });
    const causeStrategyGroups = causes.map(c => causeCategoryMap[c] || '');

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
    const groups = ['Individual','Group'];

    const nSymptoms = symptoms.length;
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
        if (gv.includes('individual')) {
            repairGroupMask[idx][0].fill(1,0,4);
        }
        if (gv.includes('widespread')) {
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
        const sIdx = parseInt(row.Severity,10)+1;
        const rInfo = repairById[row.RepairStrat];
        if (d===-1 || !rInfo) return;
        const ridx = repairNameToIndex[rInfo.Name];
        if (ridx===undefined) return;
        if (repairDefectMask[sIdx-1]) repairDefectMask[sIdx-1][d][ridx] = 1;
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

    const fullMatrix = Array.from({length:nSymptoms},()=>Array(causes.length).fill(0));
    defectCause.forEach(r => {
        const d = symptoms.indexOf(r.Defect);
        const c = causes.indexOf(r['Cause Name']);
        if (d>-1 && c>-1) fullMatrix[d][c] = 1;
    });

    return {
        data:{ symptoms, causes, causeStrategyGroups, repairStrategies, repairStrategyGroups, timeSync: lifeMean },
        fullMatrix,
        fullTotalMatrix,
        costMatrix,
        costMatrixNamed,
        costRank,
        lifeMean,
        lifeRange
    };
}

if (typeof window !== 'undefined') {
    window.loadAllData = loadAllData;
}
if (typeof module !== 'undefined') {
    module.exports = { loadAllData };
}
