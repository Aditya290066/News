/**
 * Real News - Interactive Setup Wizard
 * 
 * Prompts the user for:
 * 1. NewsAPI.org credentials (https://newsapi.org/register)
 * 2. NewsData.io credentials for Indian news coverage (https://newsdata.io/register)
 * 3. Default country focus (default: 'in' - India)
 * 4. MySQL database configuration
 * 5. Server & security settings
 * 
 * Automatically generates /server/.env, creates the database if it doesn't exist,
 * and initializes all required tables from schema.sql.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');
const crypto = require('crypto');
const mysql = require('mysql2/promise');

const ENV_PATH = path.join(__dirname, '.env');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Visual styling helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function banner() {
  console.log(`
${colors.cyan}${colors.bright}================================================================${colors.reset}
${colors.bright}               REAL NEWS - INTERACTIVE SETUP WIZARD             ${colors.reset}
${colors.cyan}================================================================${colors.reset}
This wizard will help you configure your database and dual API credentials.
All settings will be automatically saved to ${colors.yellow}server/.env${colors.reset} and
your MySQL database schema will be initialized.
`);
}

async function promptWithDefault(rl, promptText, defaultValue) {
  const displayPrompt = defaultValue !== undefined && defaultValue !== ''
    ? `${colors.bright}${promptText}${colors.reset} ${colors.dim}(default: ${defaultValue})${colors.reset}: `
    : `${colors.bright}${promptText}${colors.reset}: `;
  
  const answer = await rl.question(displayPrompt);
  const trimmed = answer.trim();
  return trimmed || defaultValue;
}

async function main() {
  banner();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // -------------------------------------------------------------
    // Step 1: NewsAPI.org Key
    // -------------------------------------------------------------
    console.log(`${colors.bright}--- Step 1: NewsAPI.org API Key (Primary Provider) ---${colors.reset}`);
    console.log(`If you don't have a free NewsAPI key yet, get one here:`);
    console.log(`${colors.blue}${colors.bright}👉 https://newsapi.org/register${colors.reset}\n`);

    let newsApiKey = '';
    while (!newsApiKey) {
      newsApiKey = await promptWithDefault(rl, 'Enter your NewsAPI.org API key');
      if (!newsApiKey) {
        console.log(`${colors.red}API key cannot be empty. Please enter your NewsAPI key.${colors.reset}`);
      }
    }

    // -------------------------------------------------------------
    // Step 2: NewsData.io Key (Indian News Provider)
    // -------------------------------------------------------------
    console.log(`\n${colors.bright}--- Step 2: NewsData.io API Key (Secondary Provider for India) ---${colors.reset}`);
    console.log(`NewsData.io provides rich, specialized coverage across Indian news sources.`);
    console.log(`Get a free API key (200 requests/day) here:`);
    console.log(`${colors.blue}${colors.bright}👉 https://newsdata.io/register${colors.reset}\n`);

    const newsDataApiKey = await promptWithDefault(
      rl,
      'Enter your NewsData.io API key (or press Enter to skip for now)',
      ''
    );

    // -------------------------------------------------------------
    // Step 3: Default Country Focus
    // -------------------------------------------------------------
    console.log(`\n${colors.bright}--- Step 3: Regional Focus ---${colors.reset}`);
    const countryCode = await promptWithDefault(
      rl,
      'Default country code (e.g. in for India, us for USA, gb for UK)',
      'in'
    );

    // -------------------------------------------------------------
    // Step 4: MySQL Database Credentials
    // -------------------------------------------------------------
    console.log(`\n${colors.bright}--- Step 4: MySQL Database Configuration ---${colors.reset}`);
    console.log(`Ensure your local or remote MySQL service is running.\n`);

    const dbHost = await promptWithDefault(rl, 'MySQL Host', 'localhost');
    const dbPort = await promptWithDefault(rl, 'MySQL Port', '3306');
    const dbUser = await promptWithDefault(rl, 'MySQL User', 'root');
    const dbPassword = await promptWithDefault(rl, 'MySQL Password', '');
    const dbName = await promptWithDefault(rl, 'MySQL Database Name', 'real_news_db');

    // -------------------------------------------------------------
    // Step 5: Server Configuration
    // -------------------------------------------------------------
    console.log(`\n${colors.bright}--- Step 5: Server & Security Configuration ---${colors.reset}`);
    const port = await promptWithDefault(rl, 'Express Server Port', '5001');
    const clientUrl = await promptWithDefault(rl, 'Frontend Client URL', 'http://localhost:5173');

    // Generate random secure JWT Secret if user doesn't specify one
    const generatedJwtSecret = crypto.randomBytes(32).toString('hex');
    const jwtSecretPrompt = await promptWithDefault(
      rl,
      'JWT Secret (leave blank to auto-generate secure secret)',
      generatedJwtSecret
    );
    const jwtSecret = jwtSecretPrompt || generatedJwtSecret;

    // -------------------------------------------------------------
    // Step 6: Test MySQL Connection & Initialize Schema
    // -------------------------------------------------------------
    console.log(`\n${colors.bright}--- Step 6: Connecting to MySQL & Initializing Schema ---${colors.reset}`);
    console.log(`Connecting to MySQL at ${dbHost}:${dbPort} as '${dbUser}'...`);

    let connection;
    try {
      connection = await mysql.createConnection({
        host: dbHost,
        port: parseInt(dbPort, 10),
        user: dbUser,
        password: dbPassword,
        multipleStatements: true,
      });

      console.log(`${colors.green}✔ Connected to MySQL successfully.${colors.reset}`);

      // Create database if not exists
      console.log(`Ensuring database '${dbName}' exists...`);
      await connection.query(
        `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
      );
      console.log(`${colors.green}✔ Database '${dbName}' is ready.${colors.reset}`);

      // Switch to database
      await connection.changeUser({ database: dbName });

      // Read and execute schema.sql
      console.log(`Executing schema.sql to verify/create tables...`);
      if (fs.existsSync(SCHEMA_PATH)) {
        const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
        await connection.query(schemaSql);
        console.log(`${colors.green}✔ Schema applied successfully (users, saved_articles, news_cache).${colors.reset}`);
      } else {
        console.warn(`${colors.yellow}⚠ Warning: schema.sql not found at ${SCHEMA_PATH}.${colors.reset}`);
      }

      await connection.end();
    } catch (dbErr) {
      console.error(`\n${colors.red}❌ MySQL Connection Error: ${dbErr.message}${colors.reset}`);
      console.log(`${colors.yellow}Please verify that MySQL is running and your credentials are correct.${colors.reset}`);
      console.log(`We will still write the .env file so you can adjust it manually.`);
    }

    // -------------------------------------------------------------
    // Step 7: Write /server/.env File
    // -------------------------------------------------------------
    console.log(`\n${colors.bright}--- Step 7: Writing Environment Variables ---${colors.reset}`);
    const envContent = `# Real News - Generated Environment Configuration
# Generated on: ${new Date().toISOString()}

# Server Port
PORT=${port}

# Default Country Code (Primary Focus: in = India)
COUNTRY_CODE=${countryCode}

# NewsAPI.org API Key (Primary Provider - https://newsapi.org/register)
NEWS_API_KEY=${newsApiKey}

# NewsData.io API Key (Secondary Provider for India - https://newsdata.io/register)
NEWSDATA_API_KEY=${newsDataApiKey}

# MySQL Database Configuration
DB_HOST=${dbHost}
DB_PORT=${dbPort}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}
DB_NAME=${dbName}

# JSON Web Token Secret Key
JWT_SECRET=${jwtSecret}

# Frontend Client URL (for CORS)
CLIENT_URL=${clientUrl}

# Background News Refresh Interval in Minutes (Default: 60)
REFRESH_INTERVAL_MINUTES=60
`;

    fs.writeFileSync(ENV_PATH, envContent, 'utf8');
    console.log(`${colors.green}✔ Created ${ENV_PATH}${colors.reset}`);

    // -------------------------------------------------------------
    // Completion Summary
    // -------------------------------------------------------------
    console.log(`
${colors.green}${colors.bright}================================================================${colors.reset}
${colors.green}${colors.bright}                 🎉 SETUP COMPLETED SUCCESSFULLY!                ${colors.reset}
${colors.green}${colors.bright}================================================================${colors.reset}

You are now ready to run the Real News application:

  1. Start the Backend:
     ${colors.cyan}npm run server${colors.reset}

  2. In a separate terminal, start the Frontend:
     ${colors.cyan}npm run client${colors.reset}

  Or from the root directory:
     ${colors.cyan}npm run dev${colors.reset} (runs both concurrently)

Primary Edition: ${colors.bright}🇮🇳 India (${countryCode})${colors.reset}
Providers: ${colors.bright}NewsAPI.org${colors.reset} + ${colors.bright}NewsData.io${colors.reset}
`);
  } catch (err) {
    console.error(`\n${colors.red}Setup aborted due to error:${colors.reset}`, err);
    process.exit(1);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = main;
