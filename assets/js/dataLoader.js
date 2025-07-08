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

    const repairStrategies = repairStrats.map(r => r.Name);
    const repairStrategyGroups = repairStrats.map(r => r.Category);
    const costMatrixNamed = repairStrats.map(r => r.Cost);
    const lifeMean  = repairStrats.map(r => parseFloat(r.LifetimeMean) || 0);
    const lifeMin   = repairStrats.map(r => parseFloat(r.LifetimeMinYears) || 0);
    const lifeMax   = repairStrats.map(r => parseFloat(r.LifetimeMaxYears) || 0);
    const lifeRange = lifeMax.map((max,i)=> Math.abs(max - lifeMin[i]));

    function costWeight(c) {
        const lc = (c || '').toLowerCase();
        if (lc.includes('low')) return 0.6;
        if (lc.includes('medium/high')) return 0.1;
        if (lc.includes('medium')) return 0.3;
        if (lc.includes('high')) return 0.1;
        return 0;
    }

    const costMatrix = costMatrixNamed.map(costWeight);
    const costRank = costMatrixNamed.map(c => {
        const lc = (c || '').toLowerCase();
        if (lc.includes('low')) return 1;
        if (lc.includes('medium')) return 2;
        if (lc.includes('high')) return 3;
        return 0;
    });

    const severityIndex = { 'Very Low':0,'Low':1,'Medium':2,'High':3,'Unknown':4 };
    const severities = Object.keys(severityIndex);
    const materials = ['asphalt','concrete'];
    const groups = ['Individual','Group'];
    const nSymptoms = symptoms.length;
    const nRepairs = repairStrategies.length;

    // initialise 5D matrix: material -> group -> severity -> defect -> repair
    const fullTotalMatrix = {};
    materials.forEach(mat => {
        fullTotalMatrix[mat] = {};
        groups.forEach(g => {
            fullTotalMatrix[mat][g] = {};
            severities.forEach(sev => {
                fullTotalMatrix[mat][g][sev] = Array.from({length:nSymptoms},()=>Array(nRepairs).fill(0));
            });
        });
    });

    const repairById = {};
    repairStrats.forEach(r => { repairById[r.id] = r; });

    defectRepair.forEach(r => {
        const d = symptoms.indexOf(r.Defect);
        const sName = r.SeverityName || 'Unknown';
        const rInfo = repairById[r.RepairStrat];
        if (d === -1 || !rInfo) return;
        const ridx = repairStrategies.indexOf(rInfo.Name);
        if (ridx === -1) return;

        const mats = /both/i.test(rInfo['Where? (road type)']) ? materials
                     : /concrete/i.test(rInfo['Where? (road type)']) ? ['concrete']
                     : /asphalt/i.test(rInfo['Where? (road type)']) ? ['asphalt']
                     : materials;

        const groupTxt = rInfo['When (# defects)'] || '';
        const grps = [];
        if (/individual/i.test(groupTxt)) grps.push('Individual');
        if (/widespread/i.test(groupTxt)) grps.push('Group');
        if (/both/i.test(groupTxt) || grps.length===0) { grps.push('Individual'); grps.push('Group'); }

        mats.forEach(mat => {
            grps.forEach(g => {
                if (fullTotalMatrix[mat][g][sName]) {
                    fullTotalMatrix[mat][g][sName][d][ridx] = costWeight(rInfo.Cost) * (parseFloat(rInfo.LifetimeMean) || 1);
                }
            });
        });
    });

    // derive Unknown severity by weighted sum
    materials.forEach(mat => {
        groups.forEach(g => {
            const u = fullTotalMatrix[mat][g]['Unknown'];
            if (!u) return;
            for (let d=0; d<nSymptoms; d++) {
                for (let r=0; r<nRepairs; r++) {
                    u[d][r] = 0.05*fullTotalMatrix[mat][g]['Very Low'][d][r]
                            + 0.10*fullTotalMatrix[mat][g]['Low'][d][r]
                            + 0.30*fullTotalMatrix[mat][g]['Medium'][d][r]
                            + 0.55*fullTotalMatrix[mat][g]['High'][d][r];
                }
            }
        });
    });

    const fullMatrix = Array.from({length:nSymptoms},()=>Array(causes.length).fill(0));
    defectCause.forEach(r => {
        const d = symptoms.indexOf(r.Defect);
        const c = causes.indexOf(r['Cause Name']);
        if (d>-1 && c>-1) fullMatrix[d][c] = 1;
    });

    const defectsByMaterial = {};
    materials.forEach(mat => {
        const set = new Set();
        groups.forEach(g => {
            severities.forEach(sev => {
                fullTotalMatrix[mat][g][sev].forEach((arr, di) => {
                    if (arr.some(v => v !== 0)) set.add(symptoms[di]);
                });
            });
        });
        defectsByMaterial[mat] = Array.from(set);
    });

    return { data:{ symptoms, causes, causeStrategyGroups, repairStrategies, repairStrategyGroups, timeSync: lifeMean }, fullMatrix, fullTotalMatrix, costMatrix, costMatrixNamed, costRank, lifeMean, lifeRange, defectsByMaterial };
}

if (typeof window !== 'undefined') {
    window.loadAllData = loadAllData;
}
if (typeof module !== 'undefined') {
    module.exports = { loadAllData };
}
