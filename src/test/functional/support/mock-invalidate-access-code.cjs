const Module = require('module');
const path = require('path');

if (process.env.MOCK_INVALIDATE_ACCESS_CODE === 'true') {
  const originalLoad = Module._load;
  let patched = false;

  Module._load = function patchedLoad(request, parent, isMain) {
    const loadedModule = originalLoad.apply(this, arguments);

    if (patched || !parent) {
      return loadedModule;
    }

    const resolved = Module._resolveFilename(request, parent, isMain);
    const targetPath = path.join('src', 'main', 'app', 'case', 'case-api.ts');

    if (resolved.endsWith(targetPath) && loadedModule?.CaseApi?.prototype) {
      const { CaseApi } = loadedModule;
      const originalTriggerEvent = CaseApi.prototype.triggerEvent;

      CaseApi.prototype.triggerEvent = async function mockTriggerEvent(caseId, partialCaseData, eventName) {
        const logger = this.logger ?? console;
        logger.info?.('Mocking access-code invalidation event for functional test support', {
          caseId,
          eventName,
        });

        return {
          id: caseId,
          state: 'Submitted',
          ...partialCaseData,
        };
      };

      CaseApi.prototype.triggerEvent.__originalTriggerEvent = originalTriggerEvent;
      patched = true;
    }

    return loadedModule;
  };
}
