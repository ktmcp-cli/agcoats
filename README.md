> "Six months ago, everyone was talking about MCPs. And I was like, screw MCPs. Every MCP would be better as a CLI."
>
> — [Peter Steinberger](https://twitter.com/steipete), Founder of OpenClaw
> [Watch on YouTube (~2:39:00)](https://www.youtube.com/@lexfridman) | [Lex Fridman Podcast #491](https://lexfridman.com/peter-steinberger/)

# AGCO ATS CLI

Production-ready CLI for the AGCO Agricultural Technology Services API. Manage farm equipment, fields, and sensor telemetry from your terminal.

## Installation

```bash
npm install -g @ktmcp-cli/agcoats
```

## Configuration

```bash
agcoats config set --api-key YOUR_API_KEY
```

## Usage

### Config

```bash
# Set API key
agcoats config set --api-key <key>

# Or set bearer token
agcoats config set --token <token>

# Get a config value
agcoats config get apiKey

# List all config
agcoats config list
```

### Equipment

```bash
# List all equipment
agcoats equipment list

# Filter by type
agcoats equipment list --type tractor
agcoats equipment list --type harvester
agcoats equipment list --type planter

# Filter by status
agcoats equipment list --status active
agcoats equipment list --status maintenance

# Get equipment details
agcoats equipment get <equipment-id>

# Register new equipment
agcoats equipment register \
  --serial-number "JD123456789" \
  --model "John Deere 8R 410" \
  --type tractor \
  --manufacturer-date 2023-01-15

# Update equipment
agcoats equipment update <equipment-id> --status maintenance
agcoats equipment update <equipment-id> --owner-id new-owner-id

# JSON output
agcoats equipment list --json
```

### Fields

```bash
# List all fields
agcoats fields list
agcoats fields list --farm-id <farm-id>

# Get field details
agcoats fields get <field-id>

# Create a new field
agcoats fields create \
  --name "North Quarter Section" \
  --area 64.75 \
  --area-unit hectares \
  --crop-type corn \
  --farm-id <farm-id>

# Update field
agcoats fields update <field-id> --crop-type wheat
agcoats fields update <field-id> --name "South Field"

# JSON output
agcoats fields list --json
```

### Sensors

```bash
# List all sensors
agcoats sensors list

# Filter sensors
agcoats sensors list --equipment-id <id>
agcoats sensors list --field-id <id>
agcoats sensors list --type temperature
agcoats sensors list --type soil-moisture

# Get sensor details
agcoats sensors get <sensor-id>

# Get historical readings
agcoats sensors readings <sensor-id>
agcoats sensors readings <sensor-id> --start-date 2024-01-01 --end-date 2024-01-31
agcoats sensors readings <sensor-id> --limit 500

# Get the latest reading
agcoats sensors latest <sensor-id>

# JSON output
agcoats sensors latest <sensor-id> --json
```

## Equipment Types

- `tractor` — Row crop and utility tractors
- `harvester` — Combine harvesters
- `planter` — Seeding equipment
- `sprayer` — Crop protection application
- `other` — Other agricultural equipment

## Sensor Types

- `temperature` — Air and engine temperature
- `humidity` — Relative humidity
- `soil-moisture` — Soil volumetric water content
- `gps` — Location coordinates
- `fuel` — Fuel level percentage
- `engine` — Engine RPM and load

## JSON Output

All commands support `--json` for machine-readable output:

```bash
# Get all equipment as JSON
agcoats equipment list --json

# Pipe to jq for filtering
agcoats equipment list --json | jq '.[] | select(.status == "active") | {id, model, serialNumber}'

# Check latest sensor readings across all sensors
agcoats sensors list --json | jq '.[].id' | xargs -I{} agcoats sensors latest {} --json
```

## License

MIT
