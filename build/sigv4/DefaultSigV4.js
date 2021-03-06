"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const sha256_js_1 = require("@aws-crypto/sha256-js");
const util_hex_encoding_1 = require("@aws-sdk/util-hex-encoding");
const Versioning_1 = require("../versioning/Versioning");
class DefaultSigV4 {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    constructor(chimeClient) {
        this.chimeClient = chimeClient;
    }
    makeTwoDigits(n) {
        /* istanbul ignore if */
        /* istanbul ignore else */
        if (n > 9) {
            return n.toString();
        }
        else {
            return '0' + n.toString();
        }
    }
    hmac(data, secret) {
        const hash = new sha256_js_1.Sha256(secret);
        hash.update(data);
        return hash.digest();
    }
    getDateTimeString() {
        const d = new Date();
        return (d.getUTCFullYear() +
            this.makeTwoDigits(d.getUTCMonth() + 1) +
            this.makeTwoDigits(d.getUTCDate()) +
            'T' +
            this.makeTwoDigits(d.getUTCHours()) +
            this.makeTwoDigits(d.getUTCMinutes()) +
            this.makeTwoDigits(d.getUTCSeconds()) +
            'Z');
    }
    getDateString(dateTimeString) {
        return dateTimeString.substring(0, dateTimeString.indexOf('T'));
    }
    getSignatureKey(key, date, regionName, serviceName) {
        return __awaiter(this, void 0, void 0, function* () {
            const kDate = yield this.hmac(date, 'AWS4' + key);
            const kRegion = yield this.hmac(regionName, kDate);
            const kService = yield this.hmac(serviceName, kRegion);
            const kSigning = yield this.hmac('aws4_request', kService);
            return kSigning;
        });
    }
    signURL(method, scheme, serviceName, hostname, path, payload, queryParams) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = this.getDateTimeString();
            const today = this.getDateString(now);
            const algorithm = 'AWS4-HMAC-SHA256';
            let region = '';
            // in AWS SDK v3 region is a function
            if (this.chimeClient.config.region instanceof Function) {
                region = yield this.chimeClient.config.region();
            }
            else {
                region = this.chimeClient.config.region;
            }
            const signedHeaders = 'host';
            const canonicalHeaders = 'host:' + hostname.toLowerCase() + '\n';
            const credentialScope = today + '/' + region + '/' + serviceName + '/' + 'aws4_request';
            let credentials = undefined;
            // in AWS SDK v3 credentials is a function
            if (this.chimeClient.config.credentials instanceof Function) {
                credentials = yield this.chimeClient.config.credentials();
            }
            else {
                credentials = this.chimeClient.config.credentials;
            }
            let params = new Map();
            params.set('X-Amz-Algorithm', [algorithm]);
            params.set('X-Amz-Credential', [
                encodeURIComponent(credentials.accessKeyId + '/' + credentialScope),
            ]);
            params.set('X-Amz-Date', [now]);
            params.set('X-Amz-Expires', ['10']);
            params.set('X-Amz-SignedHeaders', ['host']);
            if (credentials.sessionToken) {
                params.set('X-Amz-Security-Token', [encodeURIComponent(credentials.sessionToken)]);
            }
            params.set(Versioning_1.default.X_AMZN_VERSION, [encodeURIComponent(Versioning_1.default.sdkVersion)]);
            params.set(Versioning_1.default.X_AMZN_USER_AGENT, [
                encodeURIComponent(Versioning_1.default.sdkUserAgentLowResolution),
            ]);
            queryParams === null || queryParams === void 0 ? void 0 : queryParams.forEach((values, key) => {
                const encodedKey = encodeURIComponent(key);
                values.sort().forEach((value) => {
                    if (!params.has(encodedKey)) {
                        params.set(encodedKey, []);
                    }
                    params.get(encodedKey).push(encodeURIComponent(value));
                });
            });
            let canonicalQuerystring = '';
            params = new Map([...params.entries()].sort());
            params.forEach((values, key) => {
                values.forEach(value => {
                    if (canonicalQuerystring.length) {
                        canonicalQuerystring += '&';
                    }
                    canonicalQuerystring += key + '=' + value;
                });
            });
            const canonicalRequest = method +
                '\n' +
                path +
                '\n' +
                canonicalQuerystring +
                '\n' +
                canonicalHeaders +
                '\n' +
                signedHeaders +
                '\n' +
                util_hex_encoding_1.toHex(yield this.hmac(payload));
            const hashedCanonicalRequest = util_hex_encoding_1.toHex(yield this.hmac(canonicalRequest));
            const stringToSign = 'AWS4-HMAC-SHA256\n' +
                now +
                '\n' +
                today +
                '/' +
                region +
                '/' +
                serviceName +
                '/aws4_request\n' +
                hashedCanonicalRequest;
            const signingKey = yield this.getSignatureKey(credentials.secretAccessKey, today, region, serviceName);
            const signature = util_hex_encoding_1.toHex(yield this.hmac(stringToSign, signingKey));
            const finalParams = canonicalQuerystring + '&X-Amz-Signature=' + signature;
            return scheme + '://' + hostname + path + '?' + finalParams;
        });
    }
}
exports.default = DefaultSigV4;
//# sourceMappingURL=DefaultSigV4.js.map