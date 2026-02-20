import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig, isConfigured } from './config.js';
import { checkConnectivity, authenticate, getEngineIQACodes, getEngineProductionData, getCertificates, getBrands, getCurrentUser } from './api.js';

const program = new Command();

function printSuccess(message) {
  console.log(chalk.green('✓') + ' ' + message);
}

function printError(message) {
  console.error(chalk.red('✗') + ' ' + message);
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function withSpinner(message, fn) {
  const spinner = ora(message).start();
  try {
    const result = await fn();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

function requireAuth() {
  if (!isConfigured()) {
    printError('Authentication token not configured.');
    console.log('\nRun the following to authenticate:');
    console.log(chalk.cyan('  agcoats auth <username> <password>'));
    process.exit(1);
  }
}

program
  .name('agcoats')
  .description(chalk.bold('AGCO ATS CLI') + ' - Aftermarket technical services from your terminal')
  .version('1.0.0');

// CONFIG
const configCmd = program.command('config').description('Manage CLI configuration');

configCmd
  .command('set')
  .description('Set configuration values')
  .option('--token <token>', 'Set authentication token')
  .option('--base-url <url>', 'Set base URL (optional)')
  .action((options) => {
    const updates = {};
    if (options.token) updates.token = options.token;
    if (options.baseUrl) updates.baseUrl = options.baseUrl;

    setConfig(updates);
    printSuccess('Configuration updated');
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const config = getConfig();
    console.log(chalk.bold('\nCurrent configuration:'));
    console.log('  Token:', config.token ? chalk.green('✓ Set') : chalk.red('✗ Not set'));
    console.log('  Base URL:', config.baseUrl);
  });

// AUTH
program
  .command('auth')
  .description('Authenticate and store token')
  .argument('<username>', 'Username')
  .argument('<password>', 'Password')
  .option('--json', 'Output as JSON')
  .action(async (username, password, options) => {
    try {
      const data = await withSpinner('Authenticating...', () => authenticate(username, password));
      
      if (data.token) {
        setConfig({ token: data.token });
        printSuccess('Authentication successful, token saved');
      }
      
      if (options.json) {
        printJson(data);
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// HELLO
program
  .command('hello')
  .description('Check connectivity to AGCO services')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      const data = await withSpinner('Checking connectivity...', checkConnectivity);
      
      if (options.json) {
        printJson(data);
      } else {
        printSuccess('Connected to AGCO ATS services');
        console.log(data);
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ENGINE
const engineCmd = program.command('engine').description('Engine information commands');

engineCmd
  .command('iqa')
  .description('Get IQA codes for an engine')
  .argument('<serial>', 'Engine serial number')
  .option('--json', 'Output as JSON')
  .action(async (serial, options) => {
    requireAuth();
    try {
      const data = await withSpinner(`Fetching IQA codes for ${serial}...`, () => getEngineIQACodes(serial));
      
      if (options.json) {
        printJson(data);
      } else {
        console.log(chalk.bold.cyan(`\nIQA Codes for ${serial}:\n`));
        printJson(data);
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

engineCmd
  .command('production')
  .description('Get production data for an engine')
  .argument('<serial>', 'Engine serial number')
  .option('--json', 'Output as JSON')
  .action(async (serial, options) => {
    requireAuth();
    try {
      const data = await withSpinner(`Fetching production data for ${serial}...`, () => getEngineProductionData(serial));
      
      if (options.json) {
        printJson(data);
      } else {
        console.log(chalk.bold.cyan(`\nProduction Data for ${serial}:\n`));
        printJson(data);
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// CERTIFICATES
program
  .command('certificates')
  .description('Get available certificates')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const data = await withSpinner('Fetching certificates...', getCertificates);
      
      if (options.json) {
        printJson(data);
      } else {
        console.log(chalk.bold.cyan('\nCertificates:\n'));
        printJson(data);
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// BRANDS
program
  .command('brands')
  .description('Get list of brands')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const data = await withSpinner('Fetching brands...', getBrands);
      
      if (options.json) {
        printJson(data);
      } else {
        console.log(chalk.bold.cyan('\nBrands:\n'));
        if (Array.isArray(data)) {
          data.forEach(brand => {
            console.log(`  ${chalk.yellow(brand.Name || brand.name || brand)}`);
          });
        } else {
          printJson(data);
        }
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// USER
program
  .command('user')
  .description('Get current user information')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const data = await withSpinner('Fetching user info...', getCurrentUser);
      
      if (options.json) {
        printJson(data);
      } else {
        console.log(chalk.bold.cyan('\nCurrent User:\n'));
        printJson(data);
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

program.parse();
