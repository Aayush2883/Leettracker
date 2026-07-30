import fs from 'fs';
import path from 'path';

const SRC_DIR = path.join(process.cwd(), 'leetcode-company-wise-problems-main', 'leetcode-company-wise-problems-main');
const OUT_DIR = path.join(process.cwd(), 'public', 'data');
const COMP_OUT_DIR = path.join(OUT_DIR, 'companies');

// Ensure output directories exist
fs.mkdirSync(COMP_OUT_DIR, { recursive: true });

const FILE_MAP = {
  '1. Thirty Days.csv': 'thirtyDays',
  '2. Three Months.csv': 'threeMonths',
  '3. Six Months.csv': 'sixMonths',
  '4. More Than Six Months.csv': 'moreThanSixMonths',
  '5. All.csv': 'all'
};

const globalUniqueProblems = new Map(); // link -> difficulty

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(content) {
  const lines = content.split(/\r?\n/);
  if (lines.length === 0 || !lines[0]) return [];
  
  const headers = parseCSVLine(lines[0]).map(h => h.trim());
  const results = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    if (values.length < headers.length) continue;
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ? values[index].trim() : '';
    });
    results.push(row);
  }
  return results;
}

function processCompany(companyName) {
  const compDir = path.join(SRC_DIR, companyName);
  const companyId = slugify(companyName);
  
  const companyData = {
    id: companyId,
    name: companyName,
    thirtyDays: [],
    threeMonths: [],
    sixMonths: [],
    moreThanSixMonths: [],
    all: []
  };

  let hasData = false;

  for (const [fileName, key] of Object.entries(FILE_MAP)) {
    const filePath = path.join(compDir, fileName);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const rows = parseCSV(content);
        
        companyData[key] = rows.map(row => {
          const topicsStr = row['Topics'] || '';
          const topics = topicsStr
            ? topicsStr.split(',').map(t => t.trim().replace(/(^"|"$)/g, '')).filter(Boolean)
            : [];
            
          const frequency = parseFloat(row['Frequency']);
          const acceptanceRaw = parseFloat(row['Acceptance Rate']);
          const difficulty = (row['Difficulty'] || 'MEDIUM').toUpperCase().trim();
          const link = (row['Link'] || '').trim();

          if (link) {
            globalUniqueProblems.set(link, difficulty);
          }
          
          return {
            difficulty,
            title: row['Title'] || '',
            frequency: isNaN(frequency) ? 0 : Math.round(frequency * 10) / 10,
            acceptance: isNaN(acceptanceRaw) ? 0 : Math.round(acceptanceRaw * 10000 * 10) / 10,
            link,
            topics: topics
          };
        });
        
        if (companyData[key].length > 0) {
          hasData = true;
        }
      } catch (err) {
        console.error(`Error parsing ${filePath}:`, err);
      }
    }
  }

  if (!hasData) return null;

  // Write company file
  fs.writeFileSync(
    path.join(COMP_OUT_DIR, `${companyId}.json`),
    JSON.stringify(companyData, null, 2)
  );

  // Return metadata for the summary list
  return {
    id: companyId,
    name: companyName,
    counts: {
      thirtyDays: companyData.thirtyDays.length,
      threeMonths: companyData.threeMonths.length,
      sixMonths: companyData.sixMonths.length,
      moreThanSixMonths: companyData.moreThanSixMonths.length,
      all: companyData.all.length
    }
  };
}

function main() {
  console.log('Starting CSV processing...');
  
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`Source directory does not exist: ${SRC_DIR}`);
    process.exit(1);
  }

  const items = fs.readdirSync(SRC_DIR);
  const companiesMetadata = [];

  for (const item of items) {
    const fullPath = path.join(SRC_DIR, item);
    if (fs.statSync(fullPath).isDirectory()) {
      const meta = processCompany(item);
      if (meta) {
        companiesMetadata.push(meta);
      }
    }
  }

  // Sort companies alphabetically
  companiesMetadata.sort((a, b) => a.name.localeCompare(b.name));

  const total = globalUniqueProblems.size;
  let easy = 0, medium = 0, hard = 0;
  for (const diff of globalUniqueProblems.values()) {
    if (diff === 'EASY') easy++;
    else if (diff === 'MEDIUM') medium++;
    else if (diff === 'HARD') hard++;
  }

  // Write summary metadata
  fs.writeFileSync(
    path.join(OUT_DIR, 'companies.json'),
    JSON.stringify({
      totalUnique: total,
      easyCount: easy,
      mediumCount: medium,
      hardCount: hard,
      companies: companiesMetadata
    }, null, 2)
  );

  console.log(`Processed ${companiesMetadata.length} companies successfully.`);
  console.log(`Global Unique Problems: ${total} (Easy: ${easy}, Medium: ${medium}, Hard: ${hard})`);
}

main();
