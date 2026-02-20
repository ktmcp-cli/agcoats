# AGCO ATS CLI - Agent Guide

This CLI provides access to AGCO's aftermarket technical services API for agriculture equipment.

## Authentication

Username and password required. Authenticate to get a token:

```bash
agcoats auth <username> <password>
```

The token is automatically saved to config.

## Common Operations

### Check Connectivity

```bash
agcoats hello --json
```

### Engine Information

```bash
# Get IQA codes
agcoats engine iqa <serial-number> --json

# Get production data
agcoats engine production <serial-number> --json
```

### Resources

```bash
# List certificates
agcoats certificates --json

# List brands
agcoats brands --json

# Get current user
agcoats user --json
```

## Usage Patterns

All commands support `--json` for machine-readable output. Perfect for:
- Equipment diagnostics
- Technical support automation
- Parts and service management
- Agricultural fleet tracking

## Error Handling

- Returns exit code 0 on success
- Returns exit code 1 on error
- Use `--json` and check exit codes in scripts
