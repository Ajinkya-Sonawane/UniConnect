"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
const DefaultBrowserBehavior_1 = require("../browserbehavior/DefaultBrowserBehavior");
const version_1 = require("./version");
class Versioning {
    /**
     * Return string representation of SDK name
     */
    static get sdkName() {
        return 'amazon-chime-sdk-js';
    }
    /**
     * Return string representation of SDK version
     */
    static get sdkVersion() {
        return version_1.default.semverString;
    }
    /**
     * Returns the parts of the semver, so major/minor/patch can be extracted individually.
     */
    static get sdkVersionSemVer() {
        var _a, _b, _c, _d;
        const v = version_1.default.semverString.match(/^(?<major>[0-9]+)\.(?<minor>[0-9]+)((?:\.(?<patch>[0-9]+))(?:-(?<preRelease>[a-zA-Z]+(\.[0-9])*))?)?/);
        return {
            major: (_a = v === null || v === void 0 ? void 0 : v.groups) === null || _a === void 0 ? void 0 : _a.major,
            minor: (_b = v === null || v === void 0 ? void 0 : v.groups) === null || _b === void 0 ? void 0 : _b.minor,
            patch: (_c = v === null || v === void 0 ? void 0 : v.groups) === null || _c === void 0 ? void 0 : _c.patch,
            preRelease: (_d = v === null || v === void 0 ? void 0 : v.groups) === null || _d === void 0 ? void 0 : _d.preRelease,
        };
    }
    /**
     * Return the SHA-1 of the Git commit from which this build was created.
     */
    static get buildSHA() {
        // Skip the leading 'g'.
        return version_1.default.hash.substr(1);
    }
    /**
     * Return low-resolution string representation of SDK user agent (e.g. `chrome-78`)
     */
    static get sdkUserAgentLowResolution() {
        const browserBehavior = new DefaultBrowserBehavior_1.default();
        return `${browserBehavior.name()}-${browserBehavior.majorVersion()}`;
    }
    /**
     * Return URL with versioning information appended
     */
    static urlWithVersion(url) {
        const urlWithVersion = new URL(url);
        urlWithVersion.searchParams.append(Versioning.X_AMZN_VERSION, Versioning.sdkVersion);
        urlWithVersion.searchParams.append(Versioning.X_AMZN_USER_AGENT, Versioning.sdkUserAgentLowResolution);
        return urlWithVersion.toString();
    }
}
exports.default = Versioning;
Versioning.X_AMZN_VERSION = 'X-Amzn-Version';
Versioning.X_AMZN_USER_AGENT = 'X-Amzn-User-Agent';
//# sourceMappingURL=Versioning.js.map