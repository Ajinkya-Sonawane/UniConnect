"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
// Use "ua-parser-js" over "detect-browser" to get more detailed information.
const ua_parser_js_1 = require("ua-parser-js");
const Versioning_1 = require("../versioning/Versioning");
/**
 * [[DefaultUserAgentParser]] uses UAParser to parse the browser's user agent.
 * It is responsible to hold and provide browser, OS and device specific information.
 */
class DefaultUserAgentParser {
    constructor(logger) {
        var _a, _b, _c, _d, _e, _f, _g;
        try {
            this.parserResult =
                navigator && navigator.userAgent
                    ? new ua_parser_js_1.UAParser(navigator.userAgent).getResult()
                    : undefined;
        }
        catch (error) {
            /* istanbul ignore next */
            logger.error(error.message);
        }
        this.browserMajorVersion =
            ((_c = (_b = (_a = this.parserResult) === null || _a === void 0 ? void 0 : _a.browser) === null || _b === void 0 ? void 0 : _b.version) === null || _c === void 0 ? void 0 : _c.split('.')[0]) || DefaultUserAgentParser.UNAVAILABLE;
        this.browserName = ((_d = this.parserResult) === null || _d === void 0 ? void 0 : _d.browser.name) || DefaultUserAgentParser.UNAVAILABLE;
        this.browserVersion = ((_e = this.parserResult) === null || _e === void 0 ? void 0 : _e.browser.version) || DefaultUserAgentParser.UNAVAILABLE;
        this.deviceName =
            [((_f = this.parserResult) === null || _f === void 0 ? void 0 : _f.device.vendor) || '', ((_g = this.parserResult) === null || _g === void 0 ? void 0 : _g.device.model) || '']
                .join(' ')
                .trim() || DefaultUserAgentParser.UNAVAILABLE;
    }
    getParserResult() {
        var _a, _b;
        return {
            browserMajorVersion: this.browserMajorVersion,
            browserName: this.browserName,
            browserVersion: this.browserVersion,
            deviceName: this.deviceName,
            osName: ((_a = this.parserResult) === null || _a === void 0 ? void 0 : _a.os.name) || DefaultUserAgentParser.UNAVAILABLE,
            osVersion: ((_b = this.parserResult) === null || _b === void 0 ? void 0 : _b.os.version) || DefaultUserAgentParser.UNAVAILABLE,
            sdkVersion: Versioning_1.default.sdkVersion,
            sdkName: Versioning_1.default.sdkName,
        };
    }
}
exports.default = DefaultUserAgentParser;
DefaultUserAgentParser.UNAVAILABLE = 'Unavailable';
//# sourceMappingURL=DefaultUserAgentParser.js.map