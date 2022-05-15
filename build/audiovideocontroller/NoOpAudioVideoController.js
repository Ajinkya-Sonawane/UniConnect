"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
const FullJitterBackoff_1 = require("../backoff/FullJitterBackoff");
const DefaultEventController_1 = require("../eventcontroller/DefaultEventController");
const NoOpDebugLogger_1 = require("../logger/NoOpDebugLogger");
const NoOpMediaStreamBroker_1 = require("../mediastreambroker/NoOpMediaStreamBroker");
const MeetingSessionConfiguration_1 = require("../meetingsession/MeetingSessionConfiguration");
const MeetingSessionCredentials_1 = require("../meetingsession/MeetingSessionCredentials");
const MeetingSessionStatus_1 = require("../meetingsession/MeetingSessionStatus");
const MeetingSessionStatusCode_1 = require("../meetingsession/MeetingSessionStatusCode");
const MeetingSessionURLs_1 = require("../meetingsession/MeetingSessionURLs");
const DefaultReconnectController_1 = require("../reconnectcontroller/DefaultReconnectController");
const DefaultWebSocketAdapter_1 = require("../websocketadapter/DefaultWebSocketAdapter");
const DefaultAudioVideoController_1 = require("./DefaultAudioVideoController");
class NoOpAudioVideoController extends DefaultAudioVideoController_1.default {
    constructor(configuration) {
        const emptyConfiguration = new MeetingSessionConfiguration_1.default();
        emptyConfiguration.meetingId = '';
        emptyConfiguration.externalMeetingId = '';
        emptyConfiguration.credentials = new MeetingSessionCredentials_1.default();
        emptyConfiguration.credentials.attendeeId = '';
        emptyConfiguration.credentials.joinToken = '';
        emptyConfiguration.urls = new MeetingSessionURLs_1.default();
        emptyConfiguration.urls.turnControlURL = '';
        emptyConfiguration.urls.audioHostURL = '';
        emptyConfiguration.urls.signalingURL = 'wss://localhost/';
        const noOpLogger = new NoOpDebugLogger_1.default();
        super(configuration ? configuration : emptyConfiguration, noOpLogger, new DefaultWebSocketAdapter_1.default(new NoOpDebugLogger_1.default()), new NoOpMediaStreamBroker_1.default(), new DefaultReconnectController_1.default(0, new FullJitterBackoff_1.default(0, 0, 0)), new DefaultEventController_1.default(configuration ? configuration : emptyConfiguration, noOpLogger));
    }
    setAudioProfile(_audioProfile) { }
    start() { }
    stop() { }
    promoteToPrimaryMeeting(_) {
        return Promise.resolve(new MeetingSessionStatus_1.default(MeetingSessionStatusCode_1.default.OK));
    }
    demoteFromPrimaryMeeting() { }
}
exports.default = NoOpAudioVideoController;
//# sourceMappingURL=NoOpAudioVideoController.js.map