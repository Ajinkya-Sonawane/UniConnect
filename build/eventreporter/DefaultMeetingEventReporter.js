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
const Destroyable_1 = require("../destroyable/Destroyable");
const InMemoryJSONEventBuffer_1 = require("../eventbuffer/InMemoryJSONEventBuffer");
class DefaultMeetingEventReporter {
    constructor(eventIngestionConfiguration, logger) {
        this.reportingEvents = false;
        this.importantEvents = [
            'meetingEnded',
            'meetingFailed',
            'meetingStartFailed',
            'audioInputFailed',
            'videoInputFailed',
            'meetingStartSucceeded',
        ];
        this.destroyed = false;
        const { eventsClientConfiguration, ingestionURL, eventBufferConfiguration, } = eventIngestionConfiguration;
        const { eventsToIgnore } = eventsClientConfiguration;
        this.eventBuffer = new InMemoryJSONEventBuffer_1.default(eventBufferConfiguration, eventsClientConfiguration, ingestionURL, this.importantEvents, logger);
        this.logger = logger;
        this.eventsToIgnore = eventsToIgnore;
        this.start();
    }
    start() {
        if (this.reportingEvents) {
            return;
        }
        try {
            this.eventBuffer.start();
            this.logger.info('Event reporting started');
            this.reportingEvents = true;
        }
        catch (error) {
            /* istanbul ignore next */
            this.logger.error(`Event Reporting - Error starting the event buffer ${error}`);
        }
    }
    stop() {
        if (!this.reportingEvents) {
            return;
        }
        try {
            this.eventBuffer.stop();
            this.logger.info('Event reporting stopped');
            this.reportingEvents = false;
        }
        catch (error) {
            /* istanbul ignore next */
            this.logger.error(`Event Reporting - Error stopping the event buffer ${error}`);
        }
    }
    reportEvent(ts, name, attributes) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug(`Event Reporting - DefaultMeetingEventReporter - event received in reportEvent ${ts}, ${name}, ${JSON.stringify(attributes)}`);
            if (this.eventsToIgnore.includes(name)) {
                this.logger.debug(`Event Reporting - DefaultMeetingEventReporter - ${name} event will be ignored as it is in events to ignore`);
                return;
            }
            try {
                this.logger.debug(`Event Reporting - DefaultMeetingEventReporter - adding item to event buffer`);
                yield this.eventBuffer.addItem({ ts, name, attributes });
            }
            catch (error) {
                this.logger.error(`Event Reporting - Error adding event to buffer ${error}`);
            }
        });
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            this.destroyed = true;
            this.stop();
            /* istanbul ignore else */
            if (Destroyable_1.isDestroyable(this.eventBuffer)) {
                this.eventBuffer.destroy();
            }
            this.eventBuffer = undefined;
        });
    }
}
exports.default = DefaultMeetingEventReporter;
//# sourceMappingURL=DefaultMeetingEventReporter.js.map