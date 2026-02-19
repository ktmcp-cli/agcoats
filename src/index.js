import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig, isConfigured, getAllConfig } from './config.js';
import {
  listEquipment, getEquipment, registerEquipment, updateEquipment,
  listFields, getField, createField, updateField,
  listSensors, getSensor, getSensorReadings, getLatestReading
} from './api.js';

const program = new Command();

// ============================================================
// Helpers
// ============================================================

function printSuccess(message) {
  console.log(chalk.green('✓') + ' ' + message);
}

function printError(message) {
  console.error(chalk.red('✗') + ' ' + message);
}

function printTable(data, columns) {
  if (!data || data.length === 0) {
    console.log(chalk.yellow('No results found.'));
    return;
  }

  const widths = {};
  columns.forEach(col => {
    widths[col.key] = col.label.length;
    data.forEach(row => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      if (val.length > widths[col.key]) widths[col.key] = val.length;
    });
    widths[col.key] = Math.min(widths[col.key], 40);
  });

  const header = columns.map(col => col.label.padEnd(widths[col.key])).join('  ');
  console.log(chalk.bold(chalk.cyan(header)));
  console.log(chalk.dim('─'.repeat(header.length)));

  data.forEach(row => {
    const line = columns.map(col => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      return val.substring(0, widths[col.key]).padEnd(widths[col.key]);
    }).join('  ');
    console.log(line);
  });

  console.log(chalk.dim(`\n${data.length} result(s)`));
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
    printError('AGCO ATS credentials not configured.');
    console.log('\nRun the following to configure:');
    console.log(chalk.cyan('  agcoats config set --api-key <your-api-key>'));
    process.exit(1);
  }
}

// ============================================================
// Program metadata
// ============================================================

program
  .name('agcoats')
  .description(chalk.bold('AGCO ATS CLI') + ' - Agricultural technology from your terminal')
  .version('1.0.0');

// ============================================================
// CONFIG
// ============================================================

const configCmd = program.command('config').description('Manage CLI configuration');

configCmd
  .command('set')
  .description('Set configuration values')
  .option('--api-key <key>', 'AGCO ATS API Key')
  .option('--token <token>', 'Bearer token (alternative to API key)')
  .action((options) => {
    if (options.apiKey) { setConfig('apiKey', options.apiKey); printSuccess('API Key set'); }
    if (options.token) { setConfig('token', options.token); printSuccess('Token set'); }
    if (!options.apiKey && !options.token) {
      printError('No options provided. Use --api-key or --token');
    }
  });

configCmd
  .command('get')
  .description('Get a configuration value')
  .argument('<key>', 'Configuration key')
  .action((key) => {
    const value = getConfig(key);
    if (value === undefined) {
      printError(`Key '${key}' not found`);
    } else {
      console.log(value);
    }
  });

configCmd
  .command('list')
  .description('List all configuration values')
  .action(() => {
    const all = getAllConfig();
    console.log(chalk.bold('\nAGCO ATS CLI Configuration\n'));
    console.log('API Key: ', all.apiKey ? chalk.green('*'.repeat(8)) : chalk.red('not set'));
    console.log('Token:   ', all.token ? chalk.green('set') : chalk.dim('not set'));
    console.log('');
  });

// ============================================================
// EQUIPMENT
// ============================================================

const equipmentCmd = program.command('equipment').description('Manage agricultural equipment');

equipmentCmd
  .command('list')
  .description('List all registered equipment')
  .option('--type <type>', 'Filter by equipment type (tractor|harvester|planter|sprayer)')
  .option('--status <status>', 'Filter by status (active|inactive|maintenance)')
  .option('--page <n>', 'Page number', '1')
  .option('--page-size <n>', 'Results per page', '20')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const equipment = await withSpinner('Fetching equipment...', () =>
        listEquipment({
          type: options.type,
          status: options.status,
          page: parseInt(options.page),
          pageSize: parseInt(options.pageSize)
        })
      );

      if (options.json) { printJson(equipment); return; }

      const list = Array.isArray(equipment) ? equipment : [];
      printTable(list, [
        { key: 'id', label: 'ID' },
        { key: 'serialNumber', label: 'Serial Number' },
        { key: 'model', label: 'Model' },
        { key: 'type', label: 'Type' },
        { key: 'status', label: 'Status' },
        { key: 'lastSeen', label: 'Last Seen', format: (v) => v ? new Date(v).toLocaleDateString() : 'N/A' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

equipmentCmd
  .command('get <equipment-id>')
  .description('Get details of specific equipment')
  .option('--json', 'Output as JSON')
  .action(async (equipmentId, options) => {
    requireAuth();
    try {
      const equipment = await withSpinner('Fetching equipment...', () => getEquipment(equipmentId));

      if (options.json) { printJson(equipment); return; }

      console.log(chalk.bold('\nEquipment Details\n'));
      console.log('ID:              ', chalk.cyan(equipment.id));
      console.log('Serial Number:   ', chalk.bold(equipment.serialNumber || 'N/A'));
      console.log('Model:           ', equipment.model || 'N/A');
      console.log('Type:            ', equipment.type || 'N/A');
      console.log('Status:          ', equipment.status === 'active' ? chalk.green(equipment.status) : chalk.yellow(equipment.status || 'N/A'));
      console.log('Owner ID:        ', equipment.ownerId || 'N/A');
      console.log('Manufacturer:    ', equipment.manufacturer || 'N/A');
      if (equipment.location) {
        console.log('Location:        ', `${equipment.location.lat}, ${equipment.location.lng}`);
      }
      if (equipment.lastSeen) {
        console.log('Last Seen:       ', new Date(equipment.lastSeen).toLocaleString());
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

equipmentCmd
  .command('register')
  .description('Register new equipment')
  .requiredOption('--serial-number <sn>', 'Equipment serial number')
  .requiredOption('--model <model>', 'Equipment model name')
  .requiredOption('--type <type>', 'Equipment type (tractor|harvester|planter|sprayer|other)')
  .option('--manufacturer-date <date>', 'Manufacture date (YYYY-MM-DD)')
  .option('--owner-id <id>', 'Owner/operator ID')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const equipment = await withSpinner('Registering equipment...', () =>
        registerEquipment({
          serialNumber: options.serialNumber,
          model: options.model,
          type: options.type,
          manufacturerDate: options.manufacturerDate,
          ownerId: options.ownerId
        })
      );

      if (options.json) { printJson(equipment); return; }

      printSuccess('Equipment registered successfully');
      console.log('ID:            ', chalk.cyan(equipment.id));
      console.log('Serial Number: ', equipment.serialNumber);
      console.log('Model:         ', equipment.model);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

equipmentCmd
  .command('update <equipment-id>')
  .description('Update equipment details')
  .option('--status <status>', 'New status (active|inactive|maintenance)')
  .option('--owner-id <id>', 'New owner ID')
  .option('--model <model>', 'Updated model name')
  .option('--json', 'Output as JSON')
  .action(async (equipmentId, options) => {
    requireAuth();
    try {
      const updates = {};
      if (options.status) updates.status = options.status;
      if (options.ownerId) updates.ownerId = options.ownerId;
      if (options.model) updates.model = options.model;

      if (Object.keys(updates).length === 0) {
        printError('No updates provided. Use --status, --owner-id, or --model');
        process.exit(1);
      }

      const equipment = await withSpinner('Updating equipment...', () =>
        updateEquipment(equipmentId, updates)
      );

      if (options.json) { printJson(equipment); return; }

      printSuccess(`Equipment '${equipmentId}' updated`);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// FIELDS
// ============================================================

const fieldsCmd = program.command('fields').description('Manage agricultural fields');

fieldsCmd
  .command('list')
  .description('List all fields')
  .option('--farm-id <id>', 'Filter by farm ID')
  .option('--page <n>', 'Page number', '1')
  .option('--page-size <n>', 'Results per page', '20')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const fields = await withSpinner('Fetching fields...', () =>
        listFields({ farmId: options.farmId, page: parseInt(options.page), pageSize: parseInt(options.pageSize) })
      );

      if (options.json) { printJson(fields); return; }

      const list = Array.isArray(fields) ? fields : [];
      printTable(list, [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'area', label: 'Area', format: (v, row) => v ? `${v} ${row.areaUnit || 'ha'}` : 'N/A' },
        { key: 'cropType', label: 'Crop' },
        { key: 'farmId', label: 'Farm ID' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

fieldsCmd
  .command('get <field-id>')
  .description('Get details of a specific field')
  .option('--json', 'Output as JSON')
  .action(async (fieldId, options) => {
    requireAuth();
    try {
      const field = await withSpinner('Fetching field...', () => getField(fieldId));

      if (options.json) { printJson(field); return; }

      console.log(chalk.bold('\nField Details\n'));
      console.log('ID:        ', chalk.cyan(field.id));
      console.log('Name:      ', chalk.bold(field.name));
      console.log('Area:      ', field.area ? `${field.area} ${field.areaUnit || 'hectares'}` : 'N/A');
      console.log('Crop Type: ', field.cropType || 'N/A');
      console.log('Farm ID:   ', field.farmId || 'N/A');
      if (field.boundaries) {
        console.log('Boundaries:', JSON.stringify(field.boundaries).substring(0, 60) + '...');
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

fieldsCmd
  .command('create')
  .description('Create a new field')
  .requiredOption('--name <name>', 'Field name')
  .requiredOption('--area <area>', 'Field area (numeric)')
  .option('--area-unit <unit>', 'Area unit (hectares|acres|sqm)', 'hectares')
  .option('--crop-type <crop>', 'Crop type (wheat|corn|soybean|cotton|other)')
  .option('--farm-id <id>', 'Associated farm ID')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const field = await withSpinner('Creating field...', () =>
        createField({
          name: options.name,
          area: parseFloat(options.area),
          areaUnit: options.areaUnit,
          cropType: options.cropType,
          farmId: options.farmId
        })
      );

      if (options.json) { printJson(field); return; }

      printSuccess(`Field '${options.name}' created`);
      console.log('Field ID: ', chalk.cyan(field.id));
      console.log('Area:     ', `${options.area} ${options.areaUnit}`);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

fieldsCmd
  .command('update <field-id>')
  .description('Update field details')
  .option('--name <name>', 'New field name')
  .option('--crop-type <crop>', 'New crop type')
  .option('--area <area>', 'New area value')
  .option('--json', 'Output as JSON')
  .action(async (fieldId, options) => {
    requireAuth();
    try {
      const updates = {};
      if (options.name) updates.name = options.name;
      if (options.cropType) updates.cropType = options.cropType;
      if (options.area) updates.area = parseFloat(options.area);

      if (Object.keys(updates).length === 0) {
        printError('No updates provided. Use --name, --crop-type, or --area');
        process.exit(1);
      }

      const field = await withSpinner('Updating field...', () => updateField(fieldId, updates));

      if (options.json) { printJson(field); return; }

      printSuccess(`Field '${fieldId}' updated`);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// SENSORS
// ============================================================

const sensorsCmd = program.command('sensors').description('Monitor field and equipment sensors');

sensorsCmd
  .command('list')
  .description('List all sensors')
  .option('--equipment-id <id>', 'Filter by equipment ID')
  .option('--field-id <id>', 'Filter by field ID')
  .option('--type <type>', 'Filter by sensor type (temperature|humidity|soil-moisture|gps|fuel|engine)')
  .option('--page <n>', 'Page number', '1')
  .option('--page-size <n>', 'Results per page', '20')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();
    try {
      const sensors = await withSpinner('Fetching sensors...', () =>
        listSensors({
          equipmentId: options.equipmentId,
          fieldId: options.fieldId,
          type: options.type,
          page: parseInt(options.page),
          pageSize: parseInt(options.pageSize)
        })
      );

      if (options.json) { printJson(sensors); return; }

      const list = Array.isArray(sensors) ? sensors : [];
      printTable(list, [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type' },
        { key: 'equipmentId', label: 'Equipment ID' },
        { key: 'fieldId', label: 'Field ID' },
        { key: 'status', label: 'Status' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

sensorsCmd
  .command('get <sensor-id>')
  .description('Get details of a specific sensor')
  .option('--json', 'Output as JSON')
  .action(async (sensorId, options) => {
    requireAuth();
    try {
      const sensor = await withSpinner('Fetching sensor...', () => getSensor(sensorId));

      if (options.json) { printJson(sensor); return; }

      console.log(chalk.bold('\nSensor Details\n'));
      console.log('ID:           ', chalk.cyan(sensor.id));
      console.log('Name:         ', chalk.bold(sensor.name || 'N/A'));
      console.log('Type:         ', sensor.type || 'N/A');
      console.log('Equipment ID: ', sensor.equipmentId || 'N/A');
      console.log('Field ID:     ', sensor.fieldId || 'N/A');
      console.log('Status:       ', sensor.status === 'active' ? chalk.green(sensor.status) : chalk.yellow(sensor.status || 'N/A'));
      console.log('Unit:         ', sensor.unit || 'N/A');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

sensorsCmd
  .command('readings <sensor-id>')
  .description('Get historical readings from a sensor')
  .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
  .option('--end-date <date>', 'End date (YYYY-MM-DD)')
  .option('--limit <n>', 'Maximum readings to return', '100')
  .option('--json', 'Output as JSON')
  .action(async (sensorId, options) => {
    requireAuth();
    try {
      const readings = await withSpinner('Fetching sensor readings...', () =>
        getSensorReadings(sensorId, {
          startDate: options.startDate,
          endDate: options.endDate,
          limit: parseInt(options.limit)
        })
      );

      if (options.json) { printJson(readings); return; }

      const list = Array.isArray(readings) ? readings : [];
      printTable(list, [
        { key: 'timestamp', label: 'Timestamp', format: (v) => v ? new Date(v).toLocaleString() : 'N/A' },
        { key: 'value', label: 'Value' },
        { key: 'unit', label: 'Unit' },
        { key: 'quality', label: 'Quality' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

sensorsCmd
  .command('latest <sensor-id>')
  .description('Get the latest reading from a sensor')
  .option('--json', 'Output as JSON')
  .action(async (sensorId, options) => {
    requireAuth();
    try {
      const reading = await withSpinner('Fetching latest reading...', () => getLatestReading(sensorId));

      if (options.json) { printJson(reading); return; }

      console.log(chalk.bold('\nLatest Sensor Reading\n'));
      console.log('Sensor ID:  ', chalk.cyan(sensorId));
      console.log('Value:      ', chalk.bold(`${reading.value} ${reading.unit || ''}`));
      console.log('Timestamp:  ', reading.timestamp ? new Date(reading.timestamp).toLocaleString() : 'N/A');
      console.log('Quality:    ', reading.quality || 'N/A');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// Parse
// ============================================================

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
