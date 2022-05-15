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
const ClientMetricReport_1 = require("../clientmetricreport/ClientMetricReport");
const ClientMetricReportDirection_1 = require("../clientmetricreport/ClientMetricReportDirection");
const ClientMetricReportMediaType_1 = require("../clientmetricreport/ClientMetricReportMediaType");
const StreamMetricReport_1 = require("../clientmetricreport/StreamMetricReport");
const MeetingSessionLifecycleEvent_1 = require("../meetingsession/MeetingSessionLifecycleEvent");
const MeetingSessionLifecycleEventCondition_1 = require("../meetingsession/MeetingSessionLifecycleEventCondition");
const IntervalScheduler_1 = require("../scheduler/IntervalScheduler");
const SignalingProtocol_js_1 = require("../signalingprotocol/SignalingProtocol.js");
const Types_1 = require("../utils/Types");
const AudioLogEvent_1 = require("./AudioLogEvent");
const VideoLogEvent_1 = require("./VideoLogEvent");
/**
 * [[StatsCollector]] gathers statistics and sends metrics.
 */
class StatsCollector {
    constructor(audioVideoController, logger, interval = StatsCollector.INTERVAL_MS) {
        this.audioVideoController = audioVideoController;
        this.logger = logger;
        this.interval = interval;
        this.intervalScheduler = null;
        // TODO: Implement metricsAddTime() and metricsLogEvent().
        this.metricsAddTime = (_name, _duration, _attributes) => { };
        this.metricsLogEvent = (_name, _attributes) => { };
    }
    // TODO: Update toAttribute() and toSuffix() methods to convert raw data to a required type.
    /**
     * Converts string to attribute format.
     */
    toAttribute(str) {
        return this.toSuffix(str).substring(1);
    }
    /**
     * Converts string to suffix format.
     */
    toSuffix(str) {
        if (str.toLowerCase() === str) {
            // e.g. lower_case -> _lower_case
            return `_${str}`;
        }
        else if (str.toUpperCase() === str) {
            // e.g. UPPER_CASE -> _upper_case
            return `_${str.toLowerCase()}`;
        }
        else {
            // e.g. CamelCaseWithCAPS -> _camel_case_with_caps
            return str
                .replace(/([A-Z][a-z]+)/g, function ($1) {
                return `_${$1}`;
            })
                .replace(/([A-Z][A-Z]+)/g, function ($1) {
                return `_${$1}`;
            })
                .toLowerCase();
        }
    }
    /**
     * Logs the latency.
     */
    logLatency(eventName, timeMs, attributes) {
        const event = this.toSuffix(eventName);
        this.logEventTime('meeting' + event, timeMs, attributes);
    }
    /**
     * Logs the state timeout.
     */
    logStateTimeout(stateName, attributes) {
        const state = this.toSuffix(stateName);
        this.logEvent('meeting_session_state_timeout', Object.assign(Object.assign({}, attributes), { state: `state${state}` }));
    }
    /**
     * Logs the audio event.
     */
    logAudioEvent(eventName, attributes) {
        const event = 'audio' + this.toSuffix(AudioLogEvent_1.default[eventName]);
        this.logEvent(event, attributes);
    }
    /**
     * Logs the video event.
     */
    logVideoEvent(eventName, attributes) {
        const event = 'video' + this.toSuffix(VideoLogEvent_1.default[eventName]);
        this.logEvent(event, attributes);
    }
    logEventTime(eventName, timeMs, attributes = {}) {
        const finalAttributes = Object.assign(Object.assign({}, attributes), { call_id: this.audioVideoController.configuration.meetingId, client_type: StatsCollector.CLIENT_TYPE, metric_type: 'latency' });
        this.logger.debug(() => {
            return `[StatsCollector] ${eventName}: ${JSON.stringify(finalAttributes)}`;
        });
        this.metricsAddTime(eventName, timeMs, finalAttributes);
    }
    /**
     * Logs the session status.
     */
    logMeetingSessionStatus(status) {
        // TODO: Generate the status event name given the status code.
        const statusEventName = `${status.statusCode()}`;
        this.logEvent(statusEventName);
        const statusAttribute = {
            status: statusEventName,
            status_code: `${status.statusCode()}`,
        };
        this.logEvent('meeting_session_status', statusAttribute);
        if (status.isTerminal()) {
            this.logEvent('meeting_session_stopped', statusAttribute);
        }
        if (status.isAudioConnectionFailure()) {
            this.logEvent('meeting_session_audio_failed', statusAttribute);
        }
        if (status.isFailure()) {
            this.logEvent('meeting_session_failed', statusAttribute);
        }
    }
    /**
     * Logs the lifecycle event.
     */
    logLifecycleEvent(lifecycleEvent, condition) {
        const attributes = {
            lifecycle_event: `lifecycle${this.toSuffix(MeetingSessionLifecycleEvent_1.default[lifecycleEvent])}`,
            lifecycle_event_code: `${lifecycleEvent}`,
            lifecycle_event_condition: `condition${this.toSuffix(MeetingSessionLifecycleEventCondition_1.default[condition])}`,
            lifecycle_event_condition_code: `${condition}`,
        };
        this.logEvent('meeting_session_lifecycle', attributes);
    }
    /**
     * Logs the events.
     */
    logEvent(eventName, attributes = {}) {
        const finalAttributes = Object.assign(Object.assign({}, attributes), { call_id: this.audioVideoController.configuration.meetingId, client_type: StatsCollector.CLIENT_TYPE });
        this.logger.debug(() => {
            return `[StatsCollector] ${eventName}: ${JSON.stringify(finalAttributes)}`;
        });
        this.metricsLogEvent(eventName, finalAttributes);
    }
    /**
     * Starts collecting statistics.
     */
    start(signalingClient, videoStreamIndex) {
        if (this.intervalScheduler) {
            return false;
        }
        this.logger.info('Starting StatsCollector');
        this.signalingClient = signalingClient;
        this.videoStreamIndex = videoStreamIndex;
        this.clientMetricReport = new ClientMetricReport_1.default(this.logger, this.videoStreamIndex, this.audioVideoController.configuration.credentials.attendeeId);
        this.intervalScheduler = new IntervalScheduler_1.default(this.interval);
        this.intervalScheduler.start(() => __awaiter(this, void 0, void 0, function* () {
            yield this.getStatsWrapper();
        }));
        return true;
    }
    /*
     * Stops the stats collector.
     */
    stop() {
        this.logger.info('Stopping StatsCollector');
        if (this.intervalScheduler) {
            this.intervalScheduler.stop();
        }
        this.intervalScheduler = null;
    }
    /**
     * Convert raw metrics to client metric report.
     */
    updateMetricValues(rawMetricReport, isStream) {
        const metricReport = isStream
            ? this.clientMetricReport.streamMetricReports[Number(rawMetricReport.ssrc)]
            : this.clientMetricReport.globalMetricReport;
        let metricMap;
        if (isStream) {
            metricMap = this.clientMetricReport.getMetricMap(metricReport.mediaType, metricReport.direction);
        }
        else {
            metricMap = this.clientMetricReport.getMetricMap();
        }
        for (const rawMetric in rawMetricReport) {
            if (rawMetric in metricMap) {
                metricReport.previousMetrics[rawMetric] = metricReport.currentMetrics[rawMetric];
                metricReport.currentMetrics[rawMetric] = rawMetricReport[rawMetric];
            }
        }
    }
    /**
     * Converts RawMetricReport to StreamMetricReport and GlobalMetricReport and stores them as clientMetricReport.
     */
    processRawMetricReports(rawMetricReports) {
        this.clientMetricReport.currentSsrcs = {};
        const timeStamp = Date.now();
        for (const rawMetricReport of rawMetricReports) {
            const isStream = this.isStreamRawMetricReport(rawMetricReport.type);
            if (isStream) {
                const existingStreamMetricReport = this.clientMetricReport.streamMetricReports[Number(rawMetricReport.ssrc)];
                if (!existingStreamMetricReport) {
                    const streamMetricReport = new StreamMetricReport_1.default();
                    streamMetricReport.mediaType = this.getMediaType(rawMetricReport);
                    streamMetricReport.direction = this.getDirectionType(rawMetricReport);
                    if (!this.videoStreamIndex.allStreams().empty()) {
                        streamMetricReport.streamId = this.videoStreamIndex.streamIdForSSRC(Number(rawMetricReport.ssrc));
                    }
                    this.clientMetricReport.streamMetricReports[Number(rawMetricReport.ssrc)] = streamMetricReport;
                }
                else {
                    // Update stream ID in case we have overridden it locally in the case of remote video
                    // updates completed without a negotiation
                    existingStreamMetricReport.streamId = this.videoStreamIndex.streamIdForSSRC(Number(rawMetricReport.ssrc));
                }
                this.clientMetricReport.currentSsrcs[Number(rawMetricReport.ssrc)] = 1;
            }
            this.updateMetricValues(rawMetricReport, isStream);
        }
        this.clientMetricReport.removeDestroyedSsrcs();
        this.clientMetricReport.previousTimestampMs = this.clientMetricReport.currentTimestampMs;
        this.clientMetricReport.currentTimestampMs = timeStamp;
        this.clientMetricReport.print();
    }
    /**
     * Packages a metric into the MetricFrame.
     */
    addMetricFrame(metricName, clientMetricFrame, metricSpec, ssrc) {
        const type = metricSpec.type;
        const transform = metricSpec.transform;
        const sourceMetric = metricSpec.source;
        const streamMetricFramesLength = clientMetricFrame.streamMetricFrames.length;
        const latestStreamMetricFrame = clientMetricFrame.streamMetricFrames[streamMetricFramesLength - 1];
        if (type) {
            const metricFrame = SignalingProtocol_js_1.SdkMetric.create();
            metricFrame.type = type;
            metricFrame.value = sourceMetric
                ? transform(sourceMetric, ssrc)
                : transform(metricName, ssrc);
            ssrc
                ? latestStreamMetricFrame.metrics.push(metricFrame)
                : clientMetricFrame.globalMetrics.push(metricFrame);
        }
    }
    /**
     * Packages metrics in GlobalMetricReport into the MetricFrame.
     */
    addGlobalMetricsToProtobuf(clientMetricFrame) {
        const metricMap = this.clientMetricReport.getMetricMap();
        for (const metricName in this.clientMetricReport.globalMetricReport.currentMetrics) {
            this.addMetricFrame(metricName, clientMetricFrame, metricMap[metricName]);
        }
    }
    /**
     * Packages metrics in StreamMetricReport into the MetricFrame.
     */
    addStreamMetricsToProtobuf(clientMetricFrame) {
        for (const ssrc in this.clientMetricReport.streamMetricReports) {
            const streamMetricReport = this.clientMetricReport.streamMetricReports[ssrc];
            const streamMetricFrame = SignalingProtocol_js_1.SdkStreamMetricFrame.create();
            streamMetricFrame.streamId = streamMetricReport.streamId;
            streamMetricFrame.metrics = [];
            clientMetricFrame.streamMetricFrames.push(streamMetricFrame);
            const metricMap = this.clientMetricReport.getMetricMap(streamMetricReport.mediaType, streamMetricReport.direction);
            for (const metricName in streamMetricReport.currentMetrics) {
                this.addMetricFrame(metricName, clientMetricFrame, metricMap[metricName], Number(ssrc));
            }
        }
    }
    /**
     * Packages all metrics into the MetricFrame.
     */
    makeClientMetricProtobuf() {
        const clientMetricFrame = SignalingProtocol_js_1.SdkClientMetricFrame.create();
        clientMetricFrame.globalMetrics = [];
        clientMetricFrame.streamMetricFrames = [];
        this.addGlobalMetricsToProtobuf(clientMetricFrame);
        this.addStreamMetricsToProtobuf(clientMetricFrame);
        return clientMetricFrame;
    }
    /**
     * Sends the MetricFrame to Tincan via ProtoBuf.
     */
    sendClientMetricProtobuf(clientMetricFrame) {
        this.signalingClient.sendClientMetrics(clientMetricFrame);
    }
    /**
     * Checks if the type of RawMetricReport is stream related.
     */
    isStreamRawMetricReport(type) {
        return ['inbound-rtp', 'outbound-rtp', 'remote-inbound-rtp', 'remote-outbound-rtp'].includes(type);
    }
    /**
     * Returns the MediaType for a RawMetricReport.
     */
    getMediaType(rawMetricReport) {
        return rawMetricReport.kind === 'audio' ? ClientMetricReportMediaType_1.default.AUDIO : ClientMetricReportMediaType_1.default.VIDEO;
    }
    /**
     * Returns the Direction for a RawMetricReport.
     */
    getDirectionType(rawMetricReport) {
        const { type } = rawMetricReport;
        return type === 'inbound-rtp' || type === 'remote-outbound-rtp'
            ? ClientMetricReportDirection_1.default.DOWNSTREAM
            : ClientMetricReportDirection_1.default.UPSTREAM;
    }
    /**
     * Checks if a RawMetricReport belongs to certain types.
     */
    isValidStandardRawMetric(rawMetricReport) {
        return (rawMetricReport.type === 'inbound-rtp' ||
            rawMetricReport.type === 'outbound-rtp' ||
            rawMetricReport.type === 'remote-inbound-rtp' ||
            rawMetricReport.type === 'remote-outbound-rtp' ||
            (rawMetricReport.type === 'candidate-pair' && rawMetricReport.state === 'succeeded'));
    }
    /**
     * Checks if a RawMetricReport is stream related.
     */
    isValidSsrc(rawMetricReport) {
        let validSsrc = true;
        if (this.isStreamRawMetricReport(rawMetricReport.type) &&
            this.getDirectionType(rawMetricReport) === ClientMetricReportDirection_1.default.DOWNSTREAM &&
            this.getMediaType(rawMetricReport) === ClientMetricReportMediaType_1.default.VIDEO) {
            validSsrc = this.videoStreamIndex.streamIdForSSRC(Number(rawMetricReport.ssrc)) > 0;
        }
        return validSsrc;
    }
    /**
     * Checks if a RawMetricReport is valid.
     */
    isValidRawMetricReport(rawMetricReport) {
        return this.isValidStandardRawMetric(rawMetricReport) && this.isValidSsrc(rawMetricReport);
    }
    /**
     * Filters RawMetricReports and keeps the required parts.
     */
    filterRawMetricReports(rawMetricReports) {
        const filteredRawMetricReports = [];
        for (const rawMetricReport of rawMetricReports) {
            if (this.isValidRawMetricReport(rawMetricReport)) {
                filteredRawMetricReports.push(rawMetricReport);
            }
        }
        return filteredRawMetricReports;
    }
    /**
     * Performs a series operation on RawMetricReport.
     */
    handleRawMetricReports(rawMetricReports) {
        const filteredRawMetricReports = this.filterRawMetricReports(rawMetricReports);
        this.logger.debug(() => {
            return `Filtered raw metrics : ${JSON.stringify(filteredRawMetricReports)}`;
        });
        this.processRawMetricReports(filteredRawMetricReports);
        const clientMetricFrame = this.makeClientMetricProtobuf();
        this.sendClientMetricProtobuf(clientMetricFrame);
        this.audioVideoController.forEachObserver(observer => {
            Types_1.Maybe.of(observer.metricsDidReceive).map(f => f.bind(observer)(this.clientMetricReport.clone()));
        });
    }
    /**
     * Gets raw WebRTC metrics.
     */
    getStatsWrapper() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.audioVideoController.rtcPeerConnection) {
                return;
            }
            const rawMetricReports = [];
            // @ts-ignore
            try {
                const report = yield this.audioVideoController.rtcPeerConnection.getStats();
                this.clientMetricReport.rtcStatsReport = report;
                report.forEach((item) => {
                    rawMetricReports.push(item);
                });
                this.handleRawMetricReports(rawMetricReports);
            }
            catch (error) {
                this.logger.error(error.message);
            }
        });
    }
}
exports.default = StatsCollector;
StatsCollector.INTERVAL_MS = 1000;
StatsCollector.CLIENT_TYPE = 'amazon-chime-sdk-js';
//# sourceMappingURL=StatsCollector.js.map