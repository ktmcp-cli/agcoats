# AGENT.md — AGCO ATS CLI for AI Agents

## Overview

The `agcoats` CLI provides access to the AGCO Agricultural Technology Services API. Use it to manage farm equipment, field data, and IoT sensor telemetry.

## Prerequisites

Configure API credentials before use:

```bash
agcoats config set --api-key <your-api-key>
agcoats config list
```

## All Commands

### Config

```bash
agcoats config set --api-key <key>
agcoats config set --token <bearer-token>
agcoats config get apiKey
agcoats config list
```

### Equipment

```bash
agcoats equipment list
agcoats equipment list --type tractor
agcoats equipment list --type harvester
agcoats equipment list --status active
agcoats equipment list --status maintenance
agcoats equipment list --page 2 --page-size 50
agcoats equipment get <equipment-id>
agcoats equipment register --serial-number <sn> --model <model> --type tractor
agcoats equipment register --serial-number <sn> --model <model> --type harvester --manufacturer-date 2023-01-15
agcoats equipment update <equipment-id> --status active
agcoats equipment update <equipment-id> --status maintenance
agcoats equipment update <equipment-id> --owner-id <id>
```

Equipment types: tractor, harvester, planter, sprayer, other
Equipment statuses: active, inactive, maintenance

### Fields

```bash
agcoats fields list
agcoats fields list --farm-id <id>
agcoats fields get <field-id>
agcoats fields create --name <name> --area <number> --area-unit hectares --crop-type corn
agcoats fields create --name <name> --area <number> --crop-type wheat --farm-id <id>
agcoats fields update <field-id> --crop-type soybean
agcoats fields update <field-id> --name "New Field Name"
```

Crop types: wheat, corn, soybean, cotton, other
Area units: hectares, acres, sqm

### Sensors

```bash
agcoats sensors list
agcoats sensors list --equipment-id <id>
agcoats sensors list --field-id <id>
agcoats sensors list --type temperature
agcoats sensors list --type soil-moisture
agcoats sensors get <sensor-id>
agcoats sensors readings <sensor-id>
agcoats sensors readings <sensor-id> --start-date 2024-01-01 --end-date 2024-01-31
agcoats sensors readings <sensor-id> --limit 500
agcoats sensors latest <sensor-id>
```

Sensor types: temperature, humidity, soil-moisture, gps, fuel, engine

## JSON Output

Always use `--json` when parsing results:

```bash
agcoats equipment list --json
agcoats fields list --json
agcoats sensors latest <id> --json
```

## Error Handling

CLI exits with code 1 on error. Common errors:
- `Authentication failed` — Check your API key or token
- `Resource not found` — Verify the equipment/field/sensor ID
- `Rate limit exceeded` — Slow down requests
