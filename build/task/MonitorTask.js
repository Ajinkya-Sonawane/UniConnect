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
const ClientMetricReportDirection_1 = require("../clientmetricreport/ClientMetricReportDirection");
const ClientMetricReportMediaType_1 = require("../clientmetricreport/ClientMetricReportMediaType");
const ClientVideoStreamReceivingReport_1 = require("../clientmetricreport/ClientVideoStreamReceivingReport");
const ReconnectionHealthPolicy_1 = require("../connectionhealthpolicy/ReconnectionHealthPolicy");
const UnusableAudioWarningConnectionHealthPolicy_1 = require("../connectionhealthpolicy/UnusableAudioWarningConnectionHealthPolicy");
const MeetingSessionStatus_1 = require("../meetingsession/MeetingSessionStatus");
const MeetingSessionStatusCode_1 = require("../meetingsession/MeetingSessionStatusCode");
const SignalingClientEventType_1 = require("../signalingclient/SignalingClientEventType");
const SignalingProtocol_1 = require("../signalingprotocol/SignalingProtocol");
const AudioLogEvent_1 = require("../statscollector/AudioLogEvent");
const Types_1 = require("../utils/Types");
const BaseTask_1 = require("./BaseTask");
/*
 * [[MonitorTask]] monitors connections using SignalingAndMetricsConnectionMonitor.
 */
class MonitorTask extends BaseTask_1.default {
    constructor(context, connectionHealthPolicyConfiguration, initialConnectionHealthData) {
        super(context.logger);
        this.context = context;
        this.initialConnectionHealthData = initialConnectionHealthData;
        this.taskName = 'MonitorTask';
        this.prevSignalStrength = 1;
        this.currentVideoDownlinkBandwidthEstimationKbps = 10000;
        this.currentAvailableStreamAvgBitrates = null;
        this.hasSignalingError = false;
        this.presenceHandlerCalled = false;
        // See comment above invocation of `pauseResubscribeCheck` in `DefaultAudioVideoController`
        // for explanation.
        this.isResubscribeCheckPaused = false;
        this.pendingMetricsReport = undefined;
        this.checkAndSendWeakSignalEvent = (signalStrength) => {
            const isCurrentSignalBad = signalStrength < 1;
            const isPrevSignalBad = this.prevSignalStrength < 1;
            const signalStrengthEventType = isCurrentSignalBad
                ? !isPrevSignalBad
                    ? AudioLogEvent_1.default.RedmicStartLoss
                    : null
                : isPrevSignalBad
                    ? AudioLogEvent_1.default.RedmicEndLoss
                    : null;
            if (signalStrengthEventType) {
                this.context.statsCollector.logAudioEvent(signalStrengthEventType);
            }
            this.prevSignalStrength = signalStrength;
        };
        this.realtimeFatalErrorCallback = (error) => {
            this.logger.error(`realtime error: ${error}: ${error.stack}`);
            this.context.audioVideoController.handleMeetingSessionStatus(new MeetingSessionStatus_1.default(MeetingSessionStatusCode_1.default.RealtimeApiFailed), error);
        };
        this.realtimeAttendeeIdPresenceHandler = (presentAttendeeId, present) => {
            var _a;
            const attendeeId = this.context.meetingSessionConfiguration.credentials.attendeeId;
            this.logger.info(`attendeePresenceReceived: ${attendeeId}`);
            if (attendeeId === presentAttendeeId && present && !this.presenceHandlerCalled) {
                this.presenceHandlerCalled = true;
                this.context.attendeePresenceDurationMs = Date.now() - this.context.startAudioVideoTimestamp;
                (_a = this.context.eventController) === null || _a === void 0 ? void 0 : _a.publishEvent('attendeePresenceReceived', {
                    attendeePresenceDurationMs: this.context.attendeePresenceDurationMs,
                });
            }
        };
        this.generateAudioVideoEventAttributes = () => {
            const { signalingOpenDurationMs, poorConnectionCount, startTimeMs, iceGatheringDurationMs, attendeePresenceDurationMs, meetingStartDurationMs, } = this.context;
            const attributes = {
                maxVideoTileCount: this.context.maxVideoTileCount,
                meetingDurationMs: startTimeMs === null ? 0 : Math.round(Date.now() - startTimeMs),
                signalingOpenDurationMs,
                iceGatheringDurationMs,
                attendeePresenceDurationMs,
                poorConnectionCount,
                meetingStartDurationMs,
            };
            return attributes;
        };
        this.reconnectionHealthPolicy = new ReconnectionHealthPolicy_1.default(context.logger, Object.assign({}, connectionHealthPolicyConfiguration), this.initialConnectionHealthData.clone());
        this.unusableAudioWarningHealthPolicy = new UnusableAudioWarningConnectionHealthPolicy_1.default(Object.assign({}, connectionHealthPolicyConfiguration), this.initialConnectionHealthData.clone());
    }
    removeObserver() {
        this.context.audioVideoController.removeObserver(this);
        this.context.realtimeController.realtimeUnsubscribeToFatalError(this.realtimeFatalErrorCallback);
        this.context.realtimeController.realtimeUnsubscribeToLocalSignalStrengthChange(this.checkAndSendWeakSignalEvent);
        this.context.realtimeController.realtimeUnsubscribeToAttendeeIdPresence(this.realtimeAttendeeIdPresenceHandler);
        this.context.signalingClient.removeObserver(this);
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            this.context.removableObservers.push(this);
            this.context.audioVideoController.addObserver(this);
            this.context.realtimeController.realtimeSubscribeToFatalError(this.realtimeFatalErrorCallback);
            this.context.realtimeController.realtimeSubscribeToLocalSignalStrengthChange(this.checkAndSendWeakSignalEvent);
            this.context.realtimeController.realtimeSubscribeToAttendeeIdPresence(this.realtimeAttendeeIdPresenceHandler);
            this.context.connectionMonitor.start();
            this.context.statsCollector.start(this.context.signalingClient, this.context.videoStreamIndex);
            this.context.signalingClient.registerObserver(this);
        });
    }
    pauseResubscribeCheck() {
        this.isResubscribeCheckPaused = true;
    }
    resumeResubscribeCheck() {
        if (!this.isResubscribeCheckPaused) {
            // Do not recheck subcribe if it wasn't paused to begin with.
            return;
        }
        this.isResubscribeCheckPaused = false;
        if (this.pendingMetricsReport) {
            this.context.logger.info('Resuming resubscribe check with pending metrics report');
            if (this.checkResubscribe(this.pendingMetricsReport)) {
                this.context.audioVideoController.update({ needsRenegotiation: false });
            }
        }
    }
    videoTileDidUpdate(_tileState) {
        this.context.maxVideoTileCount = Math.max(this.context.maxVideoTileCount, this.context.videoTileController.getAllVideoTiles().length);
    }
    checkResubscribe(clientMetricReport) {
        if (this.isResubscribeCheckPaused) {
            this.context.logger.info('Resubscribe check is paused, setting incoming client metric report as pending');
            this.pendingMetricsReport = clientMetricReport;
            return;
        }
        else {
            this.pendingMetricsReport = undefined;
        }
        const metricReport = clientMetricReport.getObservableMetrics();
        if (!metricReport) {
            return false;
        }
        const availableSendBandwidth = metricReport.availableOutgoingBitrate;
        const nackCountPerSecond = metricReport.nackCountReceivedPerSecond;
        let needResubscribe = false;
        this.context.videoDownlinkBandwidthPolicy.updateMetrics(clientMetricReport);
        const resubscribeForDownlink = this.context.videoDownlinkBandwidthPolicy.wantsResubscribe();
        needResubscribe = needResubscribe || resubscribeForDownlink;
        if (resubscribeForDownlink) {
            this.context.videosToReceive = this.context.videoDownlinkBandwidthPolicy.chooseSubscriptions();
            this.logger.info(`trigger resubscribe for down=${resubscribeForDownlink}; videosToReceive=[${this.context.videosToReceive.array()}]`);
        }
        if (this.context.videoTileController.hasStartedLocalVideoTile()) {
            this.context.videoUplinkBandwidthPolicy.updateConnectionMetric({
                uplinkKbps: availableSendBandwidth / 1000,
                nackCountPerSecond: nackCountPerSecond,
            });
            const resubscribeForUplink = this.context.videoUplinkBandwidthPolicy.wantsResubscribe();
            needResubscribe = needResubscribe || resubscribeForUplink;
            if (resubscribeForUplink) {
                this.logger.info(`trigger resubscribe for up=${resubscribeForUplink}; videosToReceive=[${this.context.videosToReceive.array()}]`);
                this.context.videoUplinkBandwidthPolicy.chooseEncodingParameters();
                this.context.videoUplinkBandwidthPolicy.chooseMediaTrackConstraints();
            }
        }
        return needResubscribe;
    }
    metricsDidReceive(clientMetricReport) {
        const defaultClientMetricReport = clientMetricReport;
        if (!defaultClientMetricReport) {
            return;
        }
        if (this.checkResubscribe(clientMetricReport)) {
            this.context.audioVideoController.update({ needsRenegotiation: false });
        }
        if (!this.currentAvailableStreamAvgBitrates) {
            return;
        }
        const streamMetricReport = defaultClientMetricReport.streamMetricReports;
        if (!streamMetricReport) {
            return;
        }
        const metricReport = clientMetricReport.getObservableMetrics();
        this.currentVideoDownlinkBandwidthEstimationKbps = metricReport.availableIncomingBitrate;
        const downlinkVideoStream = new Map();
        const videoReceivingBitrateMap = new Map();
        // TODO: move those logic to stats collector.
        for (const ssrc in streamMetricReport) {
            if (streamMetricReport[ssrc].mediaType === ClientMetricReportMediaType_1.default.VIDEO &&
                streamMetricReport[ssrc].direction === ClientMetricReportDirection_1.default.DOWNSTREAM) {
                downlinkVideoStream.set(streamMetricReport[ssrc].streamId, streamMetricReport[ssrc]);
            }
        }
        let fireCallback = false;
        for (const bitrate of this.currentAvailableStreamAvgBitrates.bitrates) {
            if (downlinkVideoStream.has(bitrate.sourceStreamId)) {
                const report = downlinkVideoStream.get(bitrate.sourceStreamId);
                const attendeeId = this.context.videoStreamIndex.attendeeIdForStreamId(bitrate.sourceStreamId);
                if (!attendeeId) {
                    continue;
                }
                const newReport = new ClientVideoStreamReceivingReport_1.default();
                const prevBytesReceived = report.previousMetrics['bytesReceived'];
                const currBytesReceived = report.currentMetrics['bytesReceived'];
                if (!prevBytesReceived || !currBytesReceived) {
                    continue;
                }
                const receivedBitrate = ((currBytesReceived - prevBytesReceived) * 8) / 1000;
                newReport.expectedAverageBitrateKbps = bitrate.avgBitrateBps / 1000;
                newReport.receivedAverageBitrateKbps = receivedBitrate;
                newReport.attendeeId = attendeeId;
                if (receivedBitrate <
                    (bitrate.avgBitrateBps / 1000) * MonitorTask.DEFAULT_DOWNLINK_CALLRATE_UNDERSHOOT_FACTOR) {
                    fireCallback = true;
                }
                videoReceivingBitrateMap.set(attendeeId, newReport);
            }
        }
        if (fireCallback) {
            this.logger.info(`One or more video streams are not receiving expected amounts of data ${JSON.stringify(Array.from(videoReceivingBitrateMap.values()))}`);
        }
    }
    connectionHealthDidChange(connectionHealthData) {
        var _a;
        if (connectionHealthData.consecutiveMissedPongs === 0) {
            if (this.context.reconnectController) {
                this.context.reconnectController.setLastActiveTimestampMs(Date.now());
            }
        }
        this.reconnectionHealthPolicy.update(connectionHealthData);
        const reconnectionValue = this.reconnectionHealthPolicy.healthIfChanged();
        if (reconnectionValue !== null) {
            this.logger.info(`reconnection health is now: ${reconnectionValue}`);
            if (reconnectionValue === 0) {
                this.context.audioVideoController.handleMeetingSessionStatus(new MeetingSessionStatus_1.default(MeetingSessionStatusCode_1.default.ConnectionHealthReconnect), null);
            }
        }
        this.unusableAudioWarningHealthPolicy.update(connectionHealthData);
        const unusableAudioWarningValue = this.unusableAudioWarningHealthPolicy.healthIfChanged();
        if (unusableAudioWarningValue !== null) {
            this.logger.info(`unusable audio warning is now: ${unusableAudioWarningValue}`);
            if (unusableAudioWarningValue === 0) {
                this.context.poorConnectionCount += 1;
                const attributes = this.generateAudioVideoEventAttributes();
                (_a = this.context.eventController) === null || _a === void 0 ? void 0 : _a.publishEvent('receivingAudioDropped', attributes);
                if (this.context.videoTileController.haveVideoTilesWithStreams()) {
                    this.context.audioVideoController.forEachObserver((observer) => {
                        Types_1.Maybe.of(observer.connectionDidSuggestStopVideo).map(f => f.bind(observer)());
                    });
                }
                else {
                    this.context.audioVideoController.forEachObserver((observer) => {
                        Types_1.Maybe.of(observer.connectionDidBecomePoor).map(f => f.bind(observer)());
                    });
                }
            }
            else {
                this.context.audioVideoController.forEachObserver((observer) => {
                    Types_1.Maybe.of(observer.connectionDidBecomeGood).map(f => f.bind(observer)());
                });
            }
        }
    }
    handleBitrateFrame(bitrates) {
        let requiredBandwidthKbps = 0;
        this.currentAvailableStreamAvgBitrates = bitrates;
        this.logger.debug(() => {
            return `simulcast: bitrates from server ${JSON.stringify(bitrates)}`;
        });
        for (const bitrate of bitrates.bitrates) {
            if (this.context.videosToReceive.contain(bitrate.sourceStreamId)) {
                requiredBandwidthKbps += bitrate.avgBitrateBps;
            }
        }
        requiredBandwidthKbps /= 1000;
        if (this.currentVideoDownlinkBandwidthEstimationKbps *
            MonitorTask.DEFAULT_DOWNLINK_CALLRATE_OVERSHOOT_FACTOR <
            requiredBandwidthKbps) {
            this.logger.info(`Downlink bandwidth pressure is high: estimated bandwidth ${this.currentVideoDownlinkBandwidthEstimationKbps}Kbps, required bandwidth ${requiredBandwidthKbps}Kbps`);
        }
    }
    handleSignalingClientEvent(event) {
        var _a;
        // Don't add two or more consecutive "signalingDropped" states.
        if ((event.type === SignalingClientEventType_1.default.WebSocketClosed &&
            (event.closeCode === 4410 || (event.closeCode >= 4500 && event.closeCode < 4600))) ||
            event.type === SignalingClientEventType_1.default.WebSocketError ||
            event.type === SignalingClientEventType_1.default.WebSocketFailed) {
            if (!this.hasSignalingError) {
                const attributes = this.generateAudioVideoEventAttributes();
                (_a = this.context.eventController) === null || _a === void 0 ? void 0 : _a.publishEvent('signalingDropped', attributes);
                this.hasSignalingError = true;
            }
        }
        else if (event.type === SignalingClientEventType_1.default.WebSocketOpen) {
            this.hasSignalingError = false;
        }
        if (event.type === SignalingClientEventType_1.default.ReceivedSignalFrame) {
            if (!!event.message.bitrates) {
                const bitrateFrame = event.message.bitrates;
                this.context.videoStreamIndex.integrateBitratesFrame(bitrateFrame);
                this.context.videoDownlinkBandwidthPolicy.updateIndex(this.context.videoStreamIndex);
                this.handleBitrateFrame(event.message.bitrates);
            }
            const status = MeetingSessionStatus_1.default.fromSignalFrame(event.message);
            // Primary meeting join ack status will be handled by `PromoteToPrimaryMeetingTask`
            if (event.message.type !== SignalingProtocol_1.SdkSignalFrame.Type.PRIMARY_MEETING_JOIN_ACK &&
                status.statusCode() !== MeetingSessionStatusCode_1.default.OK) {
                this.context.audioVideoController.handleMeetingSessionStatus(status, null);
            }
        }
    }
}
exports.default = MonitorTask;
MonitorTask.DEFAULT_DOWNLINK_CALLRATE_OVERSHOOT_FACTOR = 2.0;
MonitorTask.DEFAULT_DOWNLINK_CALLRATE_UNDERSHOOT_FACTOR = 0.2;
//# sourceMappingURL=MonitorTask.js.map