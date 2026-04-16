# Coverage Reports - CI/CD Integration Guide

## Overview

Both **UI Click Coverage** and **Code Coverage (Nyc)** reports are now integrated into the Jenkins pipelines with **unique naming per build**.

## Report Naming Convention

Reports are automatically named with the Jenkins `BUILD_NUMBER` environment variable:

### UI Click Coverage (Playwright Tests)
- **File pattern:** `coverage/reports/ui-coverage-{BUILD_NUMBER}.html`
- **Example:** `ui-coverage-12345.html` (for build #12345)
- **Fallback:** `ui-coverage-build-{timestamp}.html` (if BUILD_NUMBER not available)

### Code Coverage (Nyc/Istanbul)
- **File pattern:** `coverage/code-coverage/coverage-{BUILD_NUMBER}.html`
- **Example:** `coverage-12345.html` (for build #12345)
- **Fallback:** `coverage-build-{timestamp}.html` (if BUILD_NUMBER not available)

## What Gets Tracked

### UI Click Coverage
Tracks which interactive elements (buttons, links, checkboxes, etc.) are clicked during tests:
- Element selector (data-testid, id, or CSS path)
- Element text and aria-label
- Click timestamp and URL
- Frequency of each element interaction

### Code Coverage (Nyc/Istanbul)
Measures statement, branch, function, and line coverage:
- Source code per-file coverage
- Branch coverage metrics
- Coverage trends over time
- HTML reports with highlighted coverage

## Jenkins Pipeline Integration

### PR Runs (Jenkinsfile_CNP)

```groovy
// After functional tests complete:
afterAlways('functionalTests') {
  // Generate UI click coverage with unique BUILD_NUMBER
  sh 'export BUILD_NUMBER="${BUILD_NUMBER}" && yarn test:coverage-report || true'
  
  // Generate code coverage with unique naming
  sh 'export BUILD_NUMBER="${BUILD_NUMBER}" && yarn test:code-coverage:ci || true'
  
  // Archive both coverage directories
  archiveArtifacts artifacts: 'coverage/**', allowEmptyArchive: true
  
  // Display report file locations
  sh '''echo "Reports generated:"; 
         ls -lh coverage/reports/*.html 2>/dev/null || echo "UI coverage report not found";
         ls -lh coverage/code-coverage/*.html 2>/dev/null || echo "Code coverage report not found"'''
}
```

### Nightly Runs (Jenkinsfile_nightly)

Same setup as PR runs - reports are generated automatically after `test:full-functional` completes.

## Accessing Reports in Jenkins

### For PR Builds
1. Navigate to PR build in Jenkins
2. Go to **Build Artifacts**
3. Find reports in:
   - `coverage/reports/ui-coverage-{BUILD_NUMBER}.html` ← **UI Click Coverage**
   - `coverage/code-coverage/coverage-{BUILD_NUMBER}.html` ← **Code Coverage**

### For Nightly Builds
Same as PR builds - reports appear in the same directories.

## Local Development

### Generate UI Coverage Report
```bash
# After tests have run and click data is collected
yarn test:coverage-report

# With specific build ID
export BUILD_NUMBER=999
yarn test:coverage-report

# Report will be at: coverage/reports/ui-coverage-999.html (or timestamp if no BUILD_NUMBER)
```

### Generate Code Coverage Report
```bash
# Requires .nyc_output from running tests with coverage instrumentation
yarn test:code-coverage

# Or with unique naming (CI-style)
export BUILD_NUMBER=999
yarn test:code-coverage:ci

# Report will be at: coverage/code-coverage/coverage-999.html
```

## Yarn Scripts Reference

```json
{
  "test:coverage-report": "Generate UI click coverage HTML report (uses BUILD_NUMBER for unique naming)",
  "test:code-coverage": "Generate code coverage reports (HTML, JSON, text summary)",
  "test:code-coverage:ci": "Generate and rename code coverage report with BUILD_NUMBER",
  "test:full-functional:coverage": "Run all functional tests + auto-generate UI coverage report"
}
```

## Report Contents

### UI Click Coverage Report
Shows:
- **Statistics:** Total tests, total clicks, unique elements, clicks per test
- **Coverage Summary Table:** Unique elements clicked + frequency
- **Test Details:** Expandable sections showing click sequence per test

### Code Coverage Report
Shows:
- **Summary:** Statement %, Branch %, Function %, Line % coverage
- **Per-File Breakdown:** Coverage for each source file
- **Highlighted Code:** Green (covered), Red (uncovered), Orange (partially covered)

## Troubleshooting

### No UI Click Coverage Report Generated
- Ensure tests use the `clickTracker` fixture (auto-enabled in `fixtures.ts`)
- Check if `coverage/click-coverage/` contains JSON files
- Verify `yarn test:coverage-report` runs without errors

### No Code Coverage Report Generated
- Ensure `.nycrc.json` exists at project root
- Check that `coverage/.nyc_output/` directory has coverage data (created during test runs)
- Verify instruments paths in `.nycrc.json` match your source code structure

### Reports Are Overwriting Each Other
- This is fixed! Reports now use `BUILD_NUMBER` from Jenkins
- Each build gets unique filenames: `ui-coverage-12345.html`, `coverage-12345.html`, etc.
- Local development uses timestamps if BUILD_NUMBER is not set

### Build Number Not Available
- Fallback to timestamp: `build-{Date.now()}.ts` on local machine
- Jenkins always provides BUILD_NUMBER environment variable

## CI/CD Best Practices

**Reports are archived** in Jenkins artifacts after each PR and nightly run  
**Unique naming** prevents accidental overwrites  
**Cleanup before tests** via `before()` hook ensures fresh directory  
**Graceful failover** with `|| true` (reports won't fail the build if not found)  
**Logging** shows exact report file locations in Jenkins console output  

## Next Steps

- View reports in build artifacts after PR/nightly runs complete
- Track coverage trends by comparing reports across builds
- Consider setting coverage thresholds in `.nycrc.json` if desired
- Archive reports to long-term storage if needed (Artifact repository, S3, etc.)
