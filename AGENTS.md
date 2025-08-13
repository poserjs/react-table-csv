# Codex Agent Guidelines

# CONTRIBUTING.md

Please follow the instructions in the CONTRIBUTING.md file, especially these sections:

- Local Development
- Linting
- Testing
- Commit Style
- Branching & PRs

# Required Test Commands

Run the following from the repository root before submitting a pull request:

```bash
npm run build    # Builds the component locally
npm run lint     # Lint the component sources
npm test         # Run tests
npm pack --dry-run # Verify package contents before publishing
```

