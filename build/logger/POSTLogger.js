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
const IntervalScheduler_1 = require("../scheduler/IntervalScheduler");
const Log_1 = require("./Log");
const LogLevel_1 = require("./LogLevel");
/**
 * `POSTLogger` publishes log messages in batches to a URL
 * supplied during its construction.
 *
 * Be sure to call {@link POSTLogger.destroy} when you're done
 * with the logger in order to avoid leaks.
 */
class POSTLogger {
    constructor(options) {
        this.logCapture = [];
        this.lock = false;
        this.sequenceNumber = 0;
        const { url, batchSize = POSTLogger.BATCH_SIZE, intervalMs = POSTLogger.INTERVAL_MS, logLevel = LogLevel_1.default.WARN, metadata, headers, } = options;
        this.url = url;
        this.batchSize = batchSize;
        this.intervalMs = intervalMs;
        this.logLevel = logLevel;
        this.metadata = metadata;
        this.headers = headers;
        this.start();
        this.eventListener = () => {
            this.stop();
        };
        this.addEventListener();
    }
    addEventListener() {
        if (!this.eventListener || !('window' in global) || !window.addEventListener) {
            return;
        }
        window.addEventListener('unload', this.eventListener);
    }
    removeEventListener() {
        if (!this.eventListener || !('window' in global) || !window.removeEventListener) {
            return;
        }
        window.removeEventListener('unload', this.eventListener);
    }
    debug(debugFunction) {
        if (LogLevel_1.default.DEBUG < this.logLevel) {
            return;
        }
        if (typeof debugFunction === 'string') {
            this.log(LogLevel_1.default.DEBUG, debugFunction);
        }
        else if (debugFunction) {
            this.log(LogLevel_1.default.DEBUG, debugFunction());
        }
        else {
            this.log(LogLevel_1.default.DEBUG, '' + debugFunction);
        }
    }
    info(msg) {
        this.log(LogLevel_1.default.INFO, msg);
    }
    warn(msg) {
        this.log(LogLevel_1.default.WARN, msg);
    }
    error(msg) {
        this.log(LogLevel_1.default.ERROR, msg);
    }
    setLogLevel(logLevel) {
        this.logLevel = logLevel;
    }
    getLogLevel() {
        return this.logLevel;
    }
    getLogCaptureSize() {
        return this.logCapture.length;
    }
    start() {
        this.addEventListener();
        this.intervalScheduler = new IntervalScheduler_1.default(this.intervalMs);
        this.intervalScheduler.start(() => __awaiter(this, void 0, void 0, function* () {
            if (this.lock === true || this.getLogCaptureSize() === 0) {
                return;
            }
            this.lock = true;
            const batch = this.logCapture.slice(0, this.batchSize);
            const body = this.makeRequestBody(batch);
            try {
                const response = yield fetch(this.url, Object.assign({ method: 'POST', body }, (this.headers
                    ? {
                        headers: this.headers,
                    }
                    : {})));
                if (response.status === 200) {
                    this.logCapture = this.logCapture.slice(batch.length);
                }
            }
            catch (error) {
                console.warn('[POSTLogger] ' + error.message);
            }
            finally {
                this.lock = false;
            }
        }));
    }
    stop() {
        var _a;
        // Clean up to avoid resource leaks.
        (_a = this.intervalScheduler) === null || _a === void 0 ? void 0 : _a.stop();
        this.intervalScheduler = undefined;
        this.removeEventListener();
        const body = this.makeRequestBody(this.logCapture);
        navigator.sendBeacon(this.url, body);
    }
    /**
     * Permanently clean up the logger. A new logger must be created to
     * resume logging.
     */
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            this.stop();
            this.metadata = undefined;
            this.headers = undefined;
            this.logCapture = [];
            this.sequenceNumber = 0;
            this.lock = false;
            this.batchSize = 0;
            this.intervalMs = 0;
            this.url = undefined;
        });
    }
    makeRequestBody(batch) {
        return JSON.stringify(Object.assign(Object.assign({}, this.metadata), { logs: batch }));
    }
    log(type, msg) {
        if (type < this.logLevel) {
            return;
        }
        const now = Date.now();
        // Handle undefined.
        this.logCapture.push(new Log_1.default(this.sequenceNumber, msg, now, LogLevel_1.default[type]));
        this.sequenceNumber += 1;
    }
}
exports.default = POSTLogger;
POSTLogger.BATCH_SIZE = 85;
POSTLogger.INTERVAL_MS = 2000;
//# sourceMappingURL=POSTLogger.js.map