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
const ua_parser_js_1 = require("ua-parser-js");
const Destroyable_1 = require("../destroyable/Destroyable");
const EventIngestionConfiguration_1 = require("../eventingestionconfiguration/EventIngestionConfiguration");
const DefaultMeetingEventReporter_1 = require("../eventreporter/DefaultMeetingEventReporter");
const MeetingEventsClientConfiguration_1 = require("../eventsclientconfiguration/MeetingEventsClientConfiguration");
const AsyncScheduler_1 = require("../scheduler/AsyncScheduler");
const Versioning_1 = require("../versioning/Versioning");
const flattenEventAttributes_1 = require("./flattenEventAttributes");
class DefaultEventController {
    constructor(configuration, logger, eventReporter) {
        var _a, _b, _c, _d, _e, _f, _g;
        this.meetingHistoryStates = [];
        this.observerSet = new Set();
        this.destroyed = false;
        this.logger = logger;
        this.configuration = configuration;
        this.setupEventReporter(configuration, logger, eventReporter);
        try {
            this.parserResult =
                navigator && navigator.userAgent ? new ua_parser_js_1.UAParser(navigator.userAgent).getResult() : null;
        }
        catch (error) {
            // This seems to never happen with ua-parser-js in reality, even with malformed strings.
            /* istanbul ignore next */
            this.logger.error(error.message);
        }
        this.browserMajorVersion =
            ((_c = (_b = (_a = this.parserResult) === null || _a === void 0 ? void 0 : _a.browser) === null || _b === void 0 ? void 0 : _b.version) === null || _c === void 0 ? void 0 : _c.split('.')[0]) || DefaultEventController.UNAVAILABLE;
        this.browserName = ((_d = this.parserResult) === null || _d === void 0 ? void 0 : _d.browser.name) || DefaultEventController.UNAVAILABLE;
        this.browserVersion = ((_e = this.parserResult) === null || _e === void 0 ? void 0 : _e.browser.version) || DefaultEventController.UNAVAILABLE;
        this.deviceName =
            [((_f = this.parserResult) === null || _f === void 0 ? void 0 : _f.device.vendor) || '', ((_g = this.parserResult) === null || _g === void 0 ? void 0 : _g.device.model) || '']
                .join(' ')
                .trim() || DefaultEventController.UNAVAILABLE;
    }
    addObserver(observer) {
        this.observerSet.add(observer);
    }
    removeObserver(observer) {
        this.observerSet.delete(observer);
    }
    forEachObserver(observerFunc) {
        for (const observer of this.observerSet) {
            AsyncScheduler_1.default.nextTick(() => {
                /* istanbul ignore else */
                if (this.observerSet.has(observer)) {
                    observerFunc(observer);
                }
            });
        }
    }
    publishEvent(name, attributes) {
        return __awaiter(this, void 0, void 0, function* () {
            const timestampMs = Date.now();
            this.meetingHistoryStates.push({
                name,
                timestampMs,
            });
            // Make a single frozen copy of the event, reusing the object returned by
            // `getAttributes` to avoid copying too much.
            const eventAttributes = Object.freeze(Object.assign(this.getAttributes(timestampMs), attributes));
            // Publishes event to observers
            this.forEachObserver((observer) => {
                observer.eventDidReceive(name, eventAttributes);
            });
            // Reports event to the ingestion service
            this.reportEvent(name, timestampMs, attributes);
        });
    }
    reportEvent(name, timestampMs, attributes) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let flattenedAttributes;
            try {
                if (attributes) {
                    flattenedAttributes = flattenEventAttributes_1.default(attributes);
                }
                yield ((_a = this.eventReporter) === null || _a === void 0 ? void 0 : _a.reportEvent(timestampMs, name, flattenedAttributes));
            }
            catch (error) {
                /* istanbul ignore next */
                this.logger.error(`Error reporting event ${error}`);
            }
        });
    }
    setupEventReporter(configuration, logger, eventReporter) {
        if (eventReporter) {
            this._eventReporter = eventReporter;
        }
        else if (configuration.urls) {
            // Attempts to set up a event reporter using the meeting configuration if one is not provided
            const eventIngestionURL = configuration.urls.eventIngestionURL;
            if (eventIngestionURL) {
                this.logger.info(`Event ingestion URL is present in the configuration`);
                const { meetingId, credentials: { attendeeId, joinToken }, } = configuration;
                const meetingEventsClientConfiguration = new MeetingEventsClientConfiguration_1.default(meetingId, attendeeId, joinToken);
                const eventIngestionConfiguration = new EventIngestionConfiguration_1.default(meetingEventsClientConfiguration, eventIngestionURL);
                this._eventReporter = new DefaultMeetingEventReporter_1.default(eventIngestionConfiguration, logger);
            }
        }
    }
    getAttributes(timestampMs) {
        var _a, _b;
        return {
            attendeeId: this.configuration.credentials.attendeeId,
            browserMajorVersion: this.browserMajorVersion,
            browserName: this.browserName,
            browserVersion: this.browserVersion,
            deviceName: this.deviceName,
            externalMeetingId: typeof this.configuration.externalMeetingId === 'string'
                ? this.configuration.externalMeetingId
                : '',
            externalUserId: this.configuration.credentials.externalUserId,
            meetingHistory: this.meetingHistoryStates,
            meetingId: this.configuration.meetingId,
            osName: ((_a = this.parserResult) === null || _a === void 0 ? void 0 : _a.os.name) || DefaultEventController.UNAVAILABLE,
            osVersion: ((_b = this.parserResult) === null || _b === void 0 ? void 0 : _b.os.version) || DefaultEventController.UNAVAILABLE,
            sdkVersion: Versioning_1.default.sdkVersion,
            sdkName: Versioning_1.default.sdkName,
            timestampMs,
        };
    }
    get eventReporter() {
        return this._eventReporter;
    }
    /**
     * Clean up this instance and resources that it created.
     *
     * After calling `destroy`, internal fields like `eventReporter` will be unavailable.
     */
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            if (Destroyable_1.isDestroyable(this.eventReporter)) {
                yield this.eventReporter.destroy();
            }
            this.logger = undefined;
            this.configuration = undefined;
            this._eventReporter = undefined;
            this.destroyed = true;
        });
    }
}
exports.default = DefaultEventController;
DefaultEventController.UNAVAILABLE = 'Unavailable';
//# sourceMappingURL=DefaultEventController.js.map