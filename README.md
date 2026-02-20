![Banner](https://raw.githubusercontent.com/ktmcp-cli/agcoats/main/banner.svg)

> "Six months ago, everyone was talking about MCPs. And I was like, screw MCPs. Every MCP would be better as a CLI."
>
> — [Peter Steinberger](https://twitter.com/steipete), Founder of OpenClaw
> [Watch on YouTube (~2:39:00)](https://www.youtube.com/@lexfridman) | [Lex Fridman Podcast #491](https://lexfridman.com/peter-steinberger/)

# AGCO ATS CLI

> **⚠️ Unofficial CLI** - Not officially sponsored or affiliated with AGCO.

A production-ready command-line interface for [AGCO ATS](https://www.agco-ats.com/) — aftermarket technical services API for agriculture equipment. Access engine data, certificates, and technical information from your terminal.

## Features

- **Engine Data** — Get IQA codes and production data for engines
- **Certificates** — List available certificates
- **Brands** — Get list of supported brands
- **User Management** — Check current user information
- **JSON output** — All commands support `--json` for scripting
- **Colorized output** — Clean terminal output with chalk

## Installation

```bash
npm install -g @ktmcp-cli/agcoats
```

## Quick Start

```bash
# Authenticate and save token
agcoats auth <username> <password>

# Check connectivity
agcoats hello

# Get engine IQA codes
agcoats engine iqa <serial-number>

# Get engine production data
agcoats engine production <serial-number>

# List brands
agcoats brands
```

## Commands

### Config

```bash
agcoats config set --token <token>
agcoats config show
```

### Authentication

```bash
agcoats auth <username> <password>    # Authenticate and save token
agcoats hello                         # Check connectivity
```

### Engine Data

```bash
agcoats engine iqa <serial>           # Get IQA codes
agcoats engine production <serial>    # Get production data
```

### Other Resources

```bash
agcoats certificates                  # List certificates
agcoats brands                        # List brands
agcoats user                          # Get current user info
```

## JSON Output

All commands support `--json` for structured output:

```bash
agcoats brands --json | jq '.[].Name'
agcoats engine iqa <serial> --json | jq '.codes'
```

## Why CLI > MCP?

No server to run. No protocol overhead. Just install and go.

- **Simpler** — Just a binary you call directly
- **Composable** — Pipe to `jq`, `grep`, `awk`
- **Scriptable** — Works in cron jobs, CI/CD, shell scripts

## License

MIT — Part of the [Kill The MCP](https://killthemcp.com) project.
