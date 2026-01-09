# Documentation Standards

This document outlines the standards for creating and maintaining documentation in the F1 Prediction Platform.

## Documentation Location

**All `.md` files must be created in the `docs/` folder only.**

### Current Structure

```
docs/
├── README.md              # Documentation index
├── INDEX.md               # Alternative index
├── QUICK_START.md         # Quick start guide
├── SETUP_INSTRUCTIONS.md  # Detailed setup instructions
├── SETUP_CHECKLIST.md     # Setup checklist
├── ARCHITECTURE.md        # System architecture
├── SETUP_GUIDE.md         # Setup guide
├── DEPLOYMENT_GUIDE.md    # Deployment guide
└── DOCUMENTATION_STANDARDS.md  # This file
```

## Creating New Documentation

### Command Line

```bash
# Create new documentation file
cd docs
touch NEW_DOCUMENTATION.md
# or
echo "# New Documentation" > docs/NEW_DOCUMENTATION.md
```

### In Code Editor

Always create new `.md` files in the `docs/` folder:
- Path: `docs/YOUR_NEW_FILE.md`
- Not: `backend/YOUR_NEW_FILE.md`
- Not: `Frontend/YOUR_NEW_FILE.md`
- Not: Root directory `YOUR_NEW_FILE.md` (except README.md)

## Exceptions

The following files are allowed in the root directory:
- `README.md` - Main project README (required by GitHub/GitLab)

All other `.md` files should be in `docs/`.

## Documentation Guidelines

### File Naming

- Use UPPER_CASE_WITH_UNDERSCORES.md for guides and standards
- Use TitleCase.md for feature documentation
- Use descriptive names: `SETUP_INSTRUCTIONS.md`, `API_REFERENCE.md`

### Content Structure

1. **Title** - Clear, descriptive title
2. **Introduction** - Brief overview
3. **Sections** - Organized with headers (##, ###)
4. **Examples** - Code examples where applicable
5. **References** - Links to related documentation

### Cross-References

Always use relative paths when linking between docs:

```markdown
- See [Setup Instructions](SETUP_INSTRUCTIONS.md)
- See [Architecture](ARCHITECTURE.md)
- See [Deployment Guide](DEPLOYMENT_GUIDE.md)
```

## Maintenance

### Updating Documentation

1. Locate the file in `docs/`
2. Update content as needed
3. Verify all links still work
4. Update `INDEX.md` if needed

### Archiving Old Documentation

Move outdated documentation to `docs/archive/`:

```bash
mkdir -p docs/archive
mv docs/OLD_DOCUMENTATION.md docs/archive/
```

## Checklist for New Documentation

- [ ] File created in `docs/` folder
- [ ] Descriptive filename with proper casing
- [ ] Clear title and introduction
- [ ] Organized sections with headers
- [ ] Code examples included where applicable
- [ ] Cross-references to related docs
- [ ] Listed in `INDEX.md` or `docs/README.md`
- [ ] No emojis in documentation (as per project standards)

## Enforcement

All new `.md` files should be created in `docs/` only. The project structure is organized to keep documentation centralized and easy to find.

## Questions?

For questions about documentation:
1. Check existing documentation in `docs/`
2. Review this standards document
3. Follow existing documentation patterns

