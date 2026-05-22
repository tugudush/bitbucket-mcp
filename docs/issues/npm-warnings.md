# NPM Deprecation Warnings Analysis

**Date:** May 22, 2026  
**Status:** Analysis Complete - No Action Required  
**Severity:** Low (dev dependencies only)

## Summary

During `npm install`, three deprecation warnings appear:

1. `inflight@1.0.6` - Memory leak warning
2. `glob@7.2.3` - Security vulnerabilities in old versions
3. `glob@10.5.0` - Security vulnerabilities in old versions

**Conclusion:** These warnings are from **transitive dependencies** in the Jest testing ecosystem. They cannot be resolved without breaking changes or waiting for upstream updates. Since they only affect dev dependencies, they pose **no risk to production code**.

---

## Detailed Analysis

### 1. inflight@1.0.6

**Warning Message:**
> This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.

**Dependency Chain:**
```
ts-jest@29.4.11
  └─┬ @jest/transform@30.4.1
    └─┬ babel-plugin-istanbul@7.0.1
      └─┬ test-exclude@6.0.0
        └─┬ glob@7.2.3
          └── inflight@1.0.6
```

**Root Cause:**
- `ts-jest@29.4.11` (latest version) depends on `babel-plugin-istanbul@7.0.1`
- `babel-plugin-istanbul@7.0.1` depends on `test-exclude@6.0.0`
- `test-exclude@6.0.0` depends on `glob@7.2.3`, which uses `inflight`

**Can We Fix It?**
- ❌ **No direct fix available**
- `ts-jest@29.4.11` is already the latest version (no newer major version exists)
- Newer `test-exclude@8.0.0` uses `glob@13.x` (no inflight), but `babel-plugin-istanbul` hasn't been updated to use it
- Using npm overrides could break Jest's code coverage functionality

**Impact:**
- ✅ **None** - Only used during test execution for code coverage
- ✅ Memory leak is theoretical and only affects long-running test processes
- ✅ No production impact

---

### 2. glob@7.2.3

**Warning Message:**
> Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me

**Dependency Chain:**
```
ts-jest@29.4.11
  └─┬ @jest/transform@30.4.1
    └─┬ babel-plugin-istanbul@7.0.1
      └─┬ test-exclude@6.0.0
        └── glob@7.2.3
```

**Root Cause:**
- Same as inflight - `test-exclude@6.0.0` hasn't been updated to use modern glob
- Current glob version is `13.0.6`, but `test-exclude@6.0.0` requires `glob@^7.1.4`

**Can We Fix It?**
- ❌ **No direct fix available**
- Would require `babel-plugin-istanbul` to upgrade to `test-exclude@7.x` or `8.x`
- `babel-plugin-istanbul@8.0.2` (latest) uses `test-exclude@7.0.1`, which uses `glob@^10.x`
- However, `ts-jest@29.4.11` still depends on `babel-plugin-istanbul@7.0.1`

**Impact:**
- ✅ **Low risk** - Security vulnerabilities are in glob's pattern matching, which is only used for test file discovery
- ✅ No network exposure or user data handling
- ✅ No production impact

---

### 3. glob@10.5.0

**Warning Message:**
> Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update.

**Dependency Chain:**
```
jest@30.4.2
  └─┬ @jest/core@30.4.2
    ├─┬ @jest/reporters@30.4.1
    │ └── glob@10.5.0
    ├─┬ jest-config@30.4.2
    │ └── glob@10.5.0 (deduped)
    └─┬ jest-runtime@30.4.2
      └── glob@10.5.0 (deduped)
```

**Root Cause:**
- `jest@30.4.2` (latest) uses `glob@10.5.0` in multiple internal packages
- Jest hasn't upgraded to glob 11+ yet
- Current glob version is `13.0.6`

**Can We Fix It?**
- ❌ **No direct fix available**
- This is controlled by Jest's internal dependencies
- Would need to wait for Jest to upgrade glob in a future release
- Using npm overrides could break Jest's test discovery and reporting

**Impact:**
- ✅ **Low risk** - Same as glob@7.2.3, only used for test file discovery
- ✅ No production impact

---

## Resolution Options

### Option 1: Wait for Upstream Updates (Recommended)

**Action:** Do nothing, wait for Jest/ts-jest to update their dependencies.

**Pros:**
- ✅ No risk of breaking changes
- ✅ Maintains stability
- ✅ Zero effort required

**Cons:**
- ⚠️ Warnings will persist until upstream updates
- ⚠️ No control over timeline

**Timeline:**
- Jest 31.x (when released) may include glob upgrades
- ts-jest 30.x (when released) may include babel-plugin-istanbul@8.x

---

### Option 2: Use npm Overrides (Not Recommended)

**Action:** Add overrides to `package.json`:

```json
{
  "overrides": {
    "glob": "^13.0.6",
    "inflight": "npm:lru-cache@^11.0.0"
  }
}
```

**Pros:**
- ✅ Eliminates warnings immediately

**Cons:**
- ❌ **High risk of breaking Jest functionality**
- ❌ glob@13.x has breaking API changes from glob@7.x and glob@10.x
- ❌ inflight replacement with lru-cache requires code changes
- ❌ Could break code coverage, test discovery, or reporting
- ❌ Not tested by Jest maintainers

**Recommendation:** Do NOT use this approach.

---

### Option 3: Suppress Warnings (Not Recommended)

**Action:** Use `npm install --silent` or `npm install 2>/dev/null`

**Pros:**
- ✅ Hides warnings from output

**Cons:**
- ❌ Hides all warnings, including potentially important ones
- ❌ Doesn't actually fix anything
- ❌ Bad practice for CI/CD pipelines

**Recommendation:** Do NOT use this approach.

---

## Recommendation

**Status:** ✅ **No action required**

**Rationale:**
1. All warnings are from **dev dependencies only** - no production impact
2. No direct fixes are available without breaking changes
3. Warnings are informational and don't indicate actual security issues in our usage context
4. Jest and ts-jest are actively maintained and will update dependencies in future releases
5. The "security vulnerabilities" in glob are theoretical for test file discovery use cases

**Next Steps:**
- Monitor Jest and ts-jest release notes for dependency updates
- Re-run `npm install` periodically to check if warnings are resolved upstream
- Consider this a known issue that will be fixed automatically over time

---

## Verification Commands

To verify the current state of these warnings:

```bash
# Check which packages depend on the deprecated modules
npm ls inflight
npm ls glob

# Check for available updates
npm outdated

# View full dependency tree
npm ls --all | grep -E "(inflight|glob)"
```

---

## References

- [inflight deprecation notice](https://github.com/npm/inflight/issues/5)
- [glob security advisories](https://github.com/isaacs/node-glob/security/advisories)
- [Jest dependencies](https://github.com/jestjs/jest/blob/main/package.json)
- [ts-jest dependencies](https://github.com/kulshekhar/ts-jest/blob/main/package.json)

---

**Last Updated:** May 22, 2026  
**Reviewed By:** AI Assistant  
**Next Review:** When Jest 31.x or ts-jest 30.x is released
