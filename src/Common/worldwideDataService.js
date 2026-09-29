/**
 * Worldwide Data Service
 * 
 * Provides centralized access to worldwide job roles and worldwide locations
 * using reputable third-party APIs (European Commission ESCO API for global occupations,
 * and Photon / OpenStreetMap API for global locations) with comprehensive local fallbacks,
 * in-memory caching, and debounced search.
 */

// Cache to prevent duplicate network calls
const roleCache = new Map();
const locationCache = new Map();
const skillCache = new Map();
const companyCache = new Map();

// Curated top worldwide job roles across industries
export const POPULAR_WORLDWIDE_JOB_ROLES = [
  // Software Engineering & Development
  'Software Engineer',
  'Senior Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Mobile App Developer (iOS / Android)',
  'React / React Native Developer',
  'Node.js Developer',
  'Python Developer',
  'Java / Spring Developer',
  'Go Developer',
  'C++ / Systems Developer',
  'Embedded Systems Engineer',
  'Solutions Architect',

  // Cloud, DevOps & Infrastructure
  'DevOps Engineer',
  'Cloud Engineer (AWS / Azure / GCP)',
  'Site Reliability Engineer (SRE)',
  'Platform Engineer',
  'Kubernetes / Cloud Native Specialist',
  'Database Administrator (DBA)',
  'System Administrator',
  'Network Engineer',

  // AI, Data Science & Analytics
  'AI / Machine Learning Engineer',
  'Data Scientist',
  'Data Analyst',
  'Data Engineer',
  'NLP / LLM Engineer',
  'Computer Vision Engineer',
  'Business Intelligence (BI) Analyst',
  'Big Data Architect',

  // Cybersecurity
  'Cybersecurity Analyst',
  'Information Security Engineer',
  'Penetration Tester / Ethical Hacker',
  'SOC Analyst',
  'Security Architect',

  // Quality Assurance
  'QA Automation Engineer',
  'Software Quality Assurance (QA) Tester',
  'SDET (Software Development Engineer in Test)',
  'Performance Test Engineer',

  // Product & Design
  'Product Manager',
  'Technical Product Manager',
  'UI/UX Designer',
  'Product Designer',
  'Visual / Graphic Designer',
  'UX Researcher',
  'Design Lead',

  // Project & Agile Management
  'Project Manager',
  'Technical Project Manager',
  'Scrum Master / Agile Coach',
  'Program Manager',
  'Engineering Manager',

  // Business, Sales & Marketing
  'Business Analyst',
  'Digital Marketing Specialist',
  'Growth Marketing Manager',
  'SEO / SEM Specialist',
  'Content Strategist',
  'Sales Development Representative (SDR)',
  'Account Executive',
  'Customer Success Manager (CSM)',
  'Salesforce Administrator / Developer',

  // Operations & Human Resources
  'Technical Recruiter / Talent Acquisition',
  'HR Manager / People Operations',
  'Operations Manager',
  'Financial Analyst',
  'Accountant',
];

// Curated top global tech hubs and worldwide business cities
export const POPULAR_WORLDWIDE_LOCATIONS = [
  'Remote',
  'Bangalore, India',
  'Mumbai, India',
  'Delhi NCR, India',
  'Hyderabad, India',
  'Pune, India',
  'Chennai, India',
  'San Francisco, California, United States',
  'New York, New York, United States',
  'Seattle, Washington, United States',
  'Austin, Texas, United States',
  'Boston, Massachusetts, United States',
  'London, England, United Kingdom',
  'Singapore',
  'Dubai, United Arab Emirates',
  'Toronto, Ontario, Canada',
  'Vancouver, British Columbia, Canada',
  'Berlin, Germany',
  'Munich, Germany',
  'Amsterdam, Netherlands',
  'Paris, France',
  'Dublin, Ireland',
  'Zurich, Switzerland',
  'Stockholm, Sweden',
  'Tokyo, Japan',
  'Sydney, New South Wales, Australia',
  'Melbourne, Victoria, Australia',
];

// Helper to format strings into Title Case
function toTitleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Returns initial worldwide job roles for dropdown defaults
 */
export const getInitialJobRoles = () => {
  return [...POPULAR_WORLDWIDE_JOB_ROLES];
};

/**
 * Returns initial worldwide locations for dropdown defaults
 */
export const getInitialLocations = () => {
  return [...POPULAR_WORLDWIDE_LOCATIONS];
};

/**
 * Third-Party API: European Commission ESCO Occupation Search
 * Searches worldwide standard occupations and job roles.
 * Falls back to local comprehensive occupational dataset.
 *
 * @param {string} query Search keyword
 * @returns {Promise<string[]>} List of worldwide job role titles
 */
export const fetchWorldwideJobRoles = async (query = '') => {
  const trimmed = (query || '').trim();

  // If empty, return popular default list
  if (!trimmed) {
    return getInitialJobRoles();
  }

  const cacheKey = trimmed.toLowerCase();
  if (roleCache.has(cacheKey)) {
    return roleCache.get(cacheKey);
  }

  // Filter local popular list first for instant relevance
  const localMatches = POPULAR_WORLDWIDE_JOB_ROLES.filter(role =>
    role.toLowerCase().includes(cacheKey)
  );

  let remoteMatches = [];

  try {
    // Official ESCO European Commission Occupational API
    const url = `https://ec.europa.eu/esco/api/search?language=en&type=occupation&text=${encodeURIComponent(trimmed)}&limit=25`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });

    if (response.ok) {
      const data = await response.json();
      const results = data._embedded?.results || [];

      remoteMatches = results
        .map(item => toTitleCase(item.title || ''))
        .filter(title => Boolean(title) && title.length > 2);
    }
  } catch (err) {
    console.warn('Third-party Job Roles API warning, falling back to local dataset:', err.message);
  }

  // Combine and deduplicate
  const seen = new Set();
  const combined = [];

  // Local direct matches first
  for (const role of localMatches) {
    const key = role.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(role);
    }
  }

  // Then remote ESCO matches
  for (const role of remoteMatches) {
    const key = role.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(role);
    }
  }

  // If query is valid, also include it as a custom option if not already present
  const formattedQuery = toTitleCase(trimmed);
  if (formattedQuery && !seen.has(formattedQuery.toLowerCase())) {
    combined.unshift(formattedQuery);
  }

  const finalResults = combined.slice(0, 30);
  roleCache.set(cacheKey, finalResults);
  return finalResults;
};

/**
 * Third-Party API: Photon (OpenStreetMap Geocoding API)
 * Searches worldwide cities, territories, and countries.
 * Falls back to country-state-city database.
 *
 * @param {string} query Search keyword
 * @returns {Promise<string[]>} List of worldwide location strings
 */
export const fetchWorldwideLocations = async (query = '') => {
  const trimmed = (query || '').trim();

  // If empty, return initial global hubs list
  if (!trimmed) {
    return getInitialLocations();
  }

  const cacheKey = trimmed.toLowerCase();
  if (locationCache.has(cacheKey)) {
    return locationCache.get(cacheKey);
  }

  // Check if query matches 'Remote'
  const remoteInclude = 'remote'.includes(cacheKey) ? ['Remote'] : [];

  // Filter curated global list
  const localCurated = POPULAR_WORLDWIDE_LOCATIONS.filter(
    loc => loc.toLowerCase().includes(cacheKey) && loc !== 'Remote'
  );

  let apiResults = [];

  try {
    // Photon OpenStreetMap Geocoding API with English localization
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&lang=en&limit=20`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });

    if (response.ok) {
      const data = await response.json();
      const features = data.features || [];

      apiResults = features
        .filter(f => {
          const p = f.properties || {};
          const osmVal = p.osm_value || '';
          const type = p.type || '';
          // Avoid non-settlement locations like airports, stadiums, bus stops
          return (
            type === 'city' ||
            type === 'town' ||
            type === 'country' ||
            type === 'state' ||
            type === 'district' ||
            type === 'locality' ||
            osmVal === 'city' ||
            osmVal === 'town' ||
            osmVal === 'administrative' ||
            osmVal === 'country' ||
            (!osmVal.includes('rail') && !osmVal.includes('station') && !osmVal.includes('airport'))
          );
        })
        .map(f => {
          const p = f.properties || {};
          const parts = [p.name, p.state, p.country].filter(Boolean);
          // Deduplicate identical adjacent names (e.g. Singapore, Singapore)
          const uniqueParts = parts.filter((part, idx) => parts.indexOf(part) === idx);
          return uniqueParts.join(', ');
        })
        .filter(Boolean);
    }
  } catch (err) {
    console.warn('Third-party Location API warning, querying local database:', err.message);
  }

  // Fallback / supplement using country-state-city database
  let cscResults = [];
  if (apiResults.length < 5) {
    try {
      const allCities = City.getAllCities();
      const countryMap = new Map();

      for (let i = 0; i < allCities.length && cscResults.length < 15; i++) {
        const c = allCities[i];
        if (c.name.toLowerCase().startsWith(cacheKey) || c.name.toLowerCase().includes(cacheKey)) {
          if (!countryMap.has(c.countryCode)) {
            const countryObj = Country.getCountryByCode(c.countryCode);
            countryMap.set(c.countryCode, countryObj ? countryObj.name : c.countryCode);
          }
          const countryName = countryMap.get(c.countryCode);
          const formatted = c.stateCode
            ? `${c.name}, ${c.stateCode}, ${countryName}`
            : `${c.name}, ${countryName}`;
          cscResults.push(formatted);
        }
      }
    } catch (e) {
      // Ignore fallback error
    }
  }

  // Combine and deduplicate results
  const seen = new Set();
  const combined = [...remoteInclude];
  seen.add('remote');

  for (const loc of [...localCurated, ...apiResults, ...cscResults]) {
    const key = loc.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(loc);
    }
  }

  // If user typed a custom valid string, allow it to be selected
  const titleQuery = toTitleCase(trimmed);
  if (titleQuery && !seen.has(titleQuery.toLowerCase()) && titleQuery.length > 2) {
    combined.push(titleQuery);
  }

  const finalResults = combined.slice(0, 30);
  locationCache.set(cacheKey, finalResults);
  return finalResults;
};

/**
 * Curated Worldwide Skills by Domain / Category
 */
export const SKILL_CATEGORIES = {
  'Popular': [
    'React', 'Node.js', 'JavaScript', 'TypeScript', 'Python', 'Java', 'AWS',
    'SQL', 'Docker', 'Kubernetes', 'HTML5', 'CSS3', 'Figma', 'Git',
    'MongoDB', 'PostgreSQL', 'Machine Learning', 'UI/UX Design', 'Agile/Scrum'
  ],
  'Frontend': [
    'React', 'Next.js', 'Vue.js', 'Angular', 'JavaScript (ES6+)', 'TypeScript',
    'HTML5', 'CSS3', 'Tailwind CSS', 'Sass/SCSS', 'Redux', 'Zustand',
    'GraphQL', 'Webpack', 'Vite', 'Bootstrap', 'WebSockets', 'Responsive Design'
  ],
  'Backend': [
    'Node.js', 'Express.js', 'NestJS', 'Python', 'Django', 'FastAPI', 'Flask',
    'Java', 'Spring Boot', 'Go (Golang)', 'C#', '.NET Core', 'PHP', 'Laravel',
    'Ruby on Rails', 'C++', 'Microservices', 'RESTful APIs', 'gRPC'
  ],
  'Cloud & DevOps': [
    'AWS (Amazon Web Services)', 'Microsoft Azure', 'Google Cloud Platform (GCP)',
    'Docker', 'Kubernetes', 'Terraform', 'CI/CD Pipelines', 'GitHub Actions',
    'GitLab CI/CD', 'Linux / Unix', 'Bash Scripting', 'Nginx', 'Ansible',
    'Prometheus', 'Grafana', 'Serverless'
  ],
  'AI & Data': [
    'Python', 'Machine Learning', 'Deep Learning', 'Generative AI',
    'Large Language Models (LLMs)', 'PyTorch', 'TensorFlow', 'Scikit-learn',
    'Data Analysis', 'Pandas', 'NumPy', 'Data Engineering', 'Apache Spark',
    'Snowflake', 'BigQuery', 'Power BI', 'Tableau', 'NLP'
  ],
  'Database': [
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQL', 'Microsoft SQL Server',
    'Oracle Database', 'Elasticsearch', 'DynamoDB', 'Supabase', 'Firebase',
    'Prisma ORM', 'Mongoose'
  ],
  'Mobile': [
    'React Native', 'Flutter', 'Swift', 'iOS Development', 'Kotlin',
    'Android Development', 'Jetpack Compose', 'Expo', 'Dart', 'Objective-C'
  ],
  'Design & Product': [
    'Figma', 'UI/UX Design', 'User Research', 'Wireframing', 'Prototyping',
    'Design Systems', 'Adobe XD', 'Adobe Photoshop', 'Adobe Illustrator',
    'Product Management', 'Jira', 'Agile / Scrum Methodologies', 'User Stories'
  ],
  'QA & Testing': [
    'Software Testing', 'Automation Testing', 'Selenium', 'Cypress',
    'Playwright', 'Jest', 'Postman', 'API Testing', 'Performance Testing',
    'Manual Testing', 'Bug Tracking', 'JUnit'
  ],
  'Cybersecurity': [
    'Network Security', 'Penetration Testing', 'Ethical Hacking', 'SOC Analysis',
    'SIEM', 'OWASP Top 10', 'Information Security', 'Cryptography',
    'Identity & Access Management (IAM)', 'Vulnerability Assessment'
  ],
  'Business & Soft Skills': [
    'Problem Solving', 'Effective Communication', 'Leadership',
    'Team Collaboration', 'Time Management', 'Critical Thinking',
    'Project Management', 'Business Analysis', 'Digital Marketing',
    'SEO / SEM', 'Salesforce CRM', 'Financial Analysis'
  ]
};

// Flattened master list of all unique curated skills
export const POPULAR_WORLDWIDE_SKILLS = Array.from(
  new Set(Object.values(SKILL_CATEGORIES).flat())
);

/**
 * Returns initial worldwide skills list
 */
export const getInitialSkills = () => {
  return [...SKILL_CATEGORIES['Popular']];
};

/**
 * Cleans ESCO skill titles to be concise and user-friendly
 */
function cleanSkillTitle(title) {
  if (!title) return '';
  let cleaned = title
    .replace(/\s*\((computer programming|programming language|software|scripting)\)/gi, '')
    .trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Third-Party API: European Commission ESCO Skills Search
 * Searches worldwide standard skills and competencies with local catalog prioritization.
 *
 * @param {string} query Search keyword
 * @returns {Promise<string[]>} List of worldwide skill titles
 */
export const fetchWorldwideSkills = async (query = '') => {
  const trimmed = (query || '').trim();

  // If empty, return popular initial skills
  if (!trimmed) {
    return getInitialSkills();
  }

  const cacheKey = trimmed.toLowerCase();
  if (skillCache.has(cacheKey)) {
    return skillCache.get(cacheKey);
  }

  // Filter curated technical skills first (very fast and highly relevant)
  const localMatches = POPULAR_WORLDWIDE_SKILLS.filter(skill =>
    skill.toLowerCase().includes(cacheKey)
  );

  let remoteMatches = [];

  // Query ESCO Skills API if query is 2+ characters
  if (trimmed.length >= 2) {
    try {
      const url = `https://ec.europa.eu/esco/api/search?language=en&type=skill&text=${encodeURIComponent(trimmed)}&limit=25`;
      const response = await fetch(url, { headers: { Accept: 'application/json' } });

      if (response.ok) {
        const data = await response.json();
        const results = data._embedded?.results || [];

        remoteMatches = results
          .map(item => cleanSkillTitle(item.title || ''))
          .filter(title => Boolean(title) && title.length > 1);
      }
    } catch (err) {
      console.warn('Third-party Skills API warning, using local dataset:', err.message);
    }
  }

  // Deduplicate and prioritize local exact/prefix matches
  const seen = new Set();
  const combined = [];

  // 1. Direct local matches
  for (const skill of localMatches) {
    const key = skill.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(skill);
    }
  }

  // 2. Remote ESCO matches
  for (const skill of remoteMatches) {
    const key = skill.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(skill);
    }
  }

  // 3. Allow custom skill typed by user
  const formattedQuery = toTitleCase(trimmed);
  if (formattedQuery && !seen.has(formattedQuery.toLowerCase())) {
    combined.unshift(formattedQuery);
  }

  const finalResults = combined.slice(0, 35);
  skillCache.set(cacheKey, finalResults);
  return finalResults;
};

/**
 * Curated Top Worldwide Companies Across Sectors
 */
export const POPULAR_WORLDWIDE_COMPANIES = [
  // Big Tech & Cloud
  'Google', 'Microsoft', 'Apple', 'Amazon', 'Meta (Facebook)', 'Netflix',
  'Nvidia', 'Intel', 'Cisco', 'IBM', 'Oracle', 'Salesforce', 'Adobe',
  'SAP', 'Qualcomm', 'Broadcom', 'AMD',

  // Global IT Services & Consulting
  'Tata Consultancy Services (TCS)', 'Infosys', 'Wipro', 'HCLTech',
  'Cognizant', 'Accenture', 'Deloitte', 'PwC', 'EY', 'KPMG',
  'Capgemini', 'Tech Mahindra', 'L&T Technology Services',

  // Fintech, Banking & Payments
  'Stripe', 'PayPal', 'Visa', 'Mastercard', 'Goldman Sachs', 'JPMorgan Chase',
  'Morgan Stanley', 'Barclays', 'HSBC', 'American Express', 'Bloomberg',

  // SaaS, Enterprise & Software
  'Snowflake', 'Databricks', 'Atlassian', 'ServiceNow', 'Workday',
  'Zoom', 'Slack', 'Twilio', 'HubSpot', 'MongoDB', 'Cloudflare',
  'Splunk', 'Intuit', 'VMware', 'Autodesk', 'Palantir',

  // Consumer, E-Commerce & Media
  'Spotify', 'Uber', 'Airbnb', 'ByteDance (TikTok)', 'Twitter (X)',
  'LinkedIn', 'Reddit', 'Pinterest', 'eBay', 'Shopify', 'Walmart',
  'Target', 'Nike', 'Sony', 'Nintendo',

  // Electronics & Telecom
  'Samsung Electronics', 'LG Electronics', 'Dell Technologies', 'HP',
  'Lenovo', 'Siemens', 'Philips', 'Bosch', 'Ericsson', 'Nokia',

  // Automotive, Aerospace & Manufacturing
  'Tesla', 'Boeing', 'Airbus', 'Ford', 'General Motors', 'Toyota',
  'Honda', 'Mercedes-Benz', 'BMW', 'Lockheed Martin',

  // Healthcare & Life Sciences
  'Johnson & Johnson', 'Pfizer', 'Novartis', 'Roche', 'AstraZeneca',
  'Moderna', 'UnitedHealth Group'
];

/**
 * Returns initial worldwide companies list
 */
export const getInitialCompanies = () => {
  return [...POPULAR_WORLDWIDE_COMPANIES];
};

/**
 * Third-Party API: Clearbit Company Autocomplete
 * Real-time worldwide company lookup with local global database fallback.
 *
 * @param {string} query Search keyword
 * @returns {Promise<string[]>} List of worldwide company names
 */
export const fetchWorldwideCompanies = async (query = '') => {
  const trimmed = (query || '').trim();

  // If empty, return initial popular companies
  if (!trimmed) {
    return getInitialCompanies();
  }

  const cacheKey = trimmed.toLowerCase();
  if (companyCache.has(cacheKey)) {
    return companyCache.get(cacheKey);
  }

  // Filter curated global list first
  const localMatches = POPULAR_WORLDWIDE_COMPANIES.filter(comp =>
    comp.toLowerCase().includes(cacheKey)
  );

  let remoteMatches = [];

  // Query Clearbit Autocomplete API
  try {
    const url = `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(trimmed)}`;
    const response = await fetch(url, { headers: { Accept: 'application/json' } });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        remoteMatches = data
          .map(item => item.name || '')
          .filter(name => Boolean(name) && name.length > 1);
      }
    }
  } catch (err) {
    console.warn('Third-party Company API warning, using local dataset:', err.message);
  }

  // Deduplicate and combine results
  const seen = new Set();
  const combined = [];

  // 1. Direct local matches
  for (const comp of localMatches) {
    const key = comp.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(comp);
    }
  }

  // 2. Remote Clearbit matches
  for (const comp of remoteMatches) {
    const key = comp.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      combined.push(comp);
    }
  }

  // 3. Allow custom company name entered by user
  const titleQuery = toTitleCase(trimmed);
  if (titleQuery && !seen.has(titleQuery.toLowerCase())) {
    combined.unshift(titleQuery);
  }

  const finalResults = combined.slice(0, 30);
  companyCache.set(cacheKey, finalResults);
  return finalResults;
};


