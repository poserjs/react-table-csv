# Codex Agent Guidelines

# CONTRIBUTING.md

Please follow the instructions in the CONTRIBUTING.md file, especially these sections:

- Local Development
- Linting
- Testing
- Commit Style
- Branching & PRs

# Before submitting the commit

Copy the contents of the src subdirectory into the demo app and verify the component is working in the app
  - `cp -p src/*.js src/*.jsx src/*.css demo/src`
  - `cd demo && npm run lint`
  - check no errors are reported by the nextjs platform
  - check no errors are reported on the web page (http://localhost:3000)
  - also stage and commit the modified files within the demo/src subdirectory

# Required Test Commands

Run the following from the repository root before submitting a pull request:

```bash
npm run build    # Builds the component locally
npm run lint     # Lint the component sources
npm test         # Run tests
npm pack --dry-run # Verify package contents before publishing
```

