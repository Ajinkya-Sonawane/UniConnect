"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
const SignalingProtocol_js_1 = require("../signalingprotocol/SignalingProtocol.js");
const ClientMetricReportDirection_1 = require("./ClientMetricReportDirection");
const ClientMetricReportMediaType_1 = require("./ClientMetricReportMediaType");
const GlobalMetricReport_1 = require("./GlobalMetricReport");
/**
 * [[ClientMetricReport]] gets the media metrics used by ConnectionMonitor to
 * update connection health data.
 */
class ClientMetricReport {
    constructor(logger, videoStreamIndex, selfAttendeeId) {
        this.logger = logger;
        this.videoStreamIndex = videoStreamIndex;
        this.selfAttendeeId = selfAttendeeId;
        this.globalMetricReport = new GlobalMetricReport_1.default();
        this.streamMetricReports = {};
        this.rtcStatsReport = {};
        this.currentTimestampMs = 0;
        this.previousTimestampMs = 0;
        this.currentSsrcs = {};
        /**
         *  Metric transform functions
         */
        this.identityValue = (metricName, ssrc) => {
            const metricReport = ssrc ? this.streamMetricReports[ssrc] : this.globalMetricReport;
            return Number(metricReport.currentMetrics[metricName]);
        };
        this.decoderLossPercent = (metricName, ssrc) => {
            const metricReport = this.streamMetricReports[ssrc];
            const concealedSamples = metricReport.currentMetrics['concealedSamples'] -
                (metricReport.previousMetrics['concealedSamples'] || 0);
            const totalSamplesReceived = metricReport.currentMetrics['totalSamplesReceived'] -
                (metricReport.previousMetrics['totalSamplesReceived'] || 0);
            if (totalSamplesReceived <= 0) {
                return 0;
            }
            const decoderAbnormal = totalSamplesReceived - concealedSamples;
            if (decoderAbnormal <= 0) {
                return 0;
            }
            return (concealedSamples / totalSamplesReceived) * 100;
        };
        this.packetLossPercent = (sourceMetricName, ssrc) => {
            const metricReport = this.streamMetricReports[ssrc];
            const sentOrReceived = metricReport.currentMetrics[sourceMetricName] -
                (metricReport.previousMetrics[sourceMetricName] || 0);
            const lost = metricReport.currentMetrics['packetsLost'] -
                (metricReport.previousMetrics['packetsLost'] || 0);
            const total = sentOrReceived + lost;
            if (total <= 0 || lost <= 0) {
                return 0;
            }
            return (lost * 100) / total;
        };
        this.jitterBufferMs = (metricName, ssrc) => {
            const metricReport = this.streamMetricReports[ssrc];
            const jitterBufferDelay = metricReport.currentMetrics['jitterBufferDelay'] -
                (metricReport.previousMetrics['jitterBufferDelay'] || 0);
            const jitterBufferEmittedCount = metricReport.currentMetrics['jitterBufferEmittedCount'] -
                (metricReport.previousMetrics['jitterBufferEmittedCount'] || 0);
            if (jitterBufferDelay <= 0) {
                return 0;
            }
            if (jitterBufferEmittedCount <= 0) {
                return 0;
            }
            return (jitterBufferDelay / jitterBufferEmittedCount) * 1000;
        };
        this.countPerSecond = (metricName, ssrc) => {
            const metricReport = ssrc ? this.streamMetricReports[ssrc] : this.globalMetricReport;
            let intervalSeconds = (this.currentTimestampMs - this.previousTimestampMs) / 1000;
            if (intervalSeconds <= 0) {
                return 0;
            }
            if (this.previousTimestampMs <= 0) {
                intervalSeconds = 1;
            }
            const diff = metricReport.currentMetrics[metricName] - (metricReport.previousMetrics[metricName] || 0);
            if (diff <= 0) {
                return 0;
            }
            return Math.trunc(diff / intervalSeconds);
        };
        this.bitsPerSecond = (metricName, ssrc) => {
            const metricReport = ssrc ? this.streamMetricReports[ssrc] : this.globalMetricReport;
            let intervalSeconds = (this.currentTimestampMs - this.previousTimestampMs) / 1000;
            if (intervalSeconds <= 0) {
                return 0;
            }
            if (this.previousTimestampMs <= 0) {
                intervalSeconds = 1;
            }
            const diff = (metricReport.currentMetrics[metricName] - (metricReport.previousMetrics[metricName] || 0)) *
                8;
            if (diff <= 0) {
                return 0;
            }
            return Math.trunc(diff / intervalSeconds);
        };
        this.secondsToMilliseconds = (metricName, ssrc) => {
            const metricReport = ssrc ? this.streamMetricReports[ssrc] : this.globalMetricReport;
            return Number(metricReport.currentMetrics[metricName] * 1000);
        };
        /**
         *  Canonical and derived metric maps
         */
        this.globalMetricMap = {
            retransmittedBytesSent: {
                transform: this.identityValue,
                type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_RETRANSMIT_BITRATE,
            },
            totalEncodedBytesTarget: {
                transform: this.identityValue,
                type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_TARGET_ENCODER_BITRATE,
            },
            totalPacketSendDelay: {
                transform: this.identityValue,
                type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_BUCKET_DELAY_MS,
            },
            packetsDiscardedOnSend: {
                transform: this.countPerSecond,
                type: SignalingProtocol_js_1.SdkMetric.Type.SOCKET_DISCARDED_PPS,
            },
            availableIncomingBitrate: {
                transform: this.identityValue,
                type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_AVAILABLE_RECEIVE_BANDWIDTH,
            },
            availableOutgoingBitrate: {
                transform: this.identityValue,
                type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_AVAILABLE_SEND_BANDWIDTH,
            },
            currentRoundTripTime: {
                transform: this.secondsToMilliseconds,
                type: SignalingProtocol_js_1.SdkMetric.Type.STUN_RTT_MS,
            },
        };
        this.audioUpstreamMetricMap = {
            jitter: { transform: this.secondsToMilliseconds, type: SignalingProtocol_js_1.SdkMetric.Type.RTC_MIC_JITTER_MS },
            packetsSent: { transform: this.countPerSecond, type: SignalingProtocol_js_1.SdkMetric.Type.RTC_MIC_PPS },
            bytesSent: { transform: this.bitsPerSecond, type: SignalingProtocol_js_1.SdkMetric.Type.RTC_MIC_BITRATE },
            roundTripTime: { transform: this.secondsToMilliseconds, type: SignalingProtocol_js_1.SdkMetric.Type.RTC_MIC_RTT_MS },
            packetsLost: {
                transform: this.packetLossPercent,
                type: SignalingProtocol_js_1.SdkMetric.Type.RTC_MIC_FRACTION_PACKET_LOST_PERCENT,
                source: 'packetsSent',
            },
        };
        this.audioDownstreamMetricMap = {
            concealedSamples: {
                transform: this.countPerSecond,
            },
            totalSamplesReceived: {
                transform: this.countPerSecond,
            },
            decoderLoss: {
                transform: this.decoderLossPercent,
                type: SignalingProtocol_js_1.SdkMetric.Type.RTC_SPK_FRACTION_DECODER_LOSS_PERCENT,
            },
            packetsReceived: { transform: this.countPerSecond, type: SignalingProtocol_js_1.SdkMetric.Type.RTC_SPK_PPS },
            packetsLost: {
                transform: this.packetLossPercent,
                type: SignalingProtocol_js_1.SdkMetric.Type.RTC_SPK_FRACTION_PACKET_LOST_PERCENT,
                source: 'packetsReceived',
            },
            jitter: { transform: this.secondsToMilliseconds, type: SignalingProtocol_js_1.SdkMetric.Type.RTC_SPK_JITTER_MS },
            jitterBufferDelay: {
                transform: this.countPerSecond,
            },
            jitterBufferEmittedCount: {
                transform: this.countPerSecond,
            },
            jitterBufferMs: {
                transform: this.jitterBufferMs,
                type: SignalingProtocol_js_1.SdkMetric.Type.RTC_SPK_JITTER_BUFFER_MS,
            },
            bytesReceived: { transform: this.bitsPerSecond, type: SignalingProtocol_js_1.SdkMetric.Type.RTC_SPK_BITRATE },
        };
        this.videoUpstreamMetricMap = {
            roundTripTime: {
                transform: this.secondsToMilliseconds,
                type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_SENT_RTT_MS,
            },
            nackCount: { transform: this.countPerSecond, type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_NACKS_RECEIVED },
            pliCount: { transform: this.countPerSecond, type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_PLIS_RECEIVED },
            firCount: { transform: this.countPerSecond, type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_FIRS_RECEIVED },
            framesPerSecond: { transform: this.identityValue, type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_INPUT_FPS },
            framesEncoded: { transform: this.countPerSecond, type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_ENCODE_FPS },
            packetsSent: { transform: this.countPerSecond, type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_SENT_PPS },
            packetsLost: {
                transform: this.packetLossPercent,
                type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_SENT_FRACTION_PACKET_LOST_PERCENT,
                source: 'packetsSent',
            },
            bytesSent: { transform: this.bitsPerSecond, type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_SENT_BITRATE },
            qpSum: { transform: this.countPerSecond, type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_SENT_QP_SUM },
            frameHeight: { transform: this.identityValue, type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_ENCODE_HEIGHT },
            frameWidth: { transform: this.identityValue, type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_ENCODE_WIDTH },
            jitter: {
                transform: this.secondsToMilliseconds,
            },
        };
        this.videoDownstreamMetricMap = {
            totalDecodeTime: { transform: this.identityValue, type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_DECODE_MS },
            packetsReceived: { transform: this.countPerSecond, type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_RECEIVED_PPS },
            packetsLost: {
                transform: this.packetLossPercent,
                type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_RECEIVED_FRACTION_PACKET_LOST_PERCENT,
                source: 'packetsReceived',
            },
            framesReceived: {
                transform: this.identityValue,
                type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_RECEIVED_FPS,
            },
            framesDecoded: { transform: this.countPerSecond, type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_DECODE_FPS },
            nackCount: { transform: this.countPerSecond, type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_NACKS_SENT },
            firCount: { transform: this.countPerSecond, type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_FIRS_SENT },
            pliCount: { transform: this.countPerSecond, type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_PLIS_SENT },
            bytesReceived: { transform: this.bitsPerSecond, type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_RECEIVED_BITRATE },
            jitter: {
                transform: this.secondsToMilliseconds,
                type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_RECEIVED_JITTER_MS,
            },
            jitterBufferDelay: {
                transform: this.countPerSecond,
            },
            jitterBufferEmittedCount: {
                transform: this.countPerSecond,
            },
            jitterBufferMs: {
                transform: this.jitterBufferMs,
                type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_JITTER_BUFFER_MS,
            },
            qpSum: {
                transform: this.countPerSecond,
                type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_RECEIVED_QP_SUM,
            },
            frameHeight: { transform: this.identityValue, type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_DECODE_HEIGHT },
            frameWidth: { transform: this.identityValue, type: SignalingProtocol_js_1.SdkMetric.Type.VIDEO_DECODE_WIDTH },
        };
        /**
         *  media Stream metrics
         */
        this.observableVideoMetricSpec = {
            videoUpstreamBitrate: {
                source: 'bytesSent',
                media: ClientMetricReportMediaType_1.default.VIDEO,
                dir: ClientMetricReportDirection_1.default.UPSTREAM,
            },
            videoUpstreamPacketsSent: {
                source: 'packetsSent',
                media: ClientMetricReportMediaType_1.default.VIDEO,
                dir: ClientMetricReportDirection_1.default.UPSTREAM,
            },
            videoUpstreamPacketLossPercent: {
                source: 'packetsLost',
                media: ClientMetricReportMediaType_1.default.VIDEO,
                dir: ClientMetricReportDirection_1.default.UPSTREAM,
            },
            videoUpstreamFramesEncodedPerSecond: {
                source: 'framesEncoded',
                media: ClientMetricReportMediaType_1.default.VIDEO,
                dir: ClientMetricReportDirection_1.default.UPSTREAM,
            },
            videoUpstreamFrameHeight: {
                source: 'frameHeight',
                media: ClientMetricReportMediaType_1.default.VIDEO,
                dir: ClientMetricReportDirection_1.default.UPSTREAM,
            },
            videoUpstreamFrameWidth: {
                source: 'frameWidth',
                media: ClientMetricReportMediaType_1.default.VIDEO,
                dir: ClientMetricReportDirection_1.default.UPSTREAM,
            },
            videoUpstreamJitterMs: {
                source: 'jitter',
                media: ClientMetricReportMediaType_1.default.VIDEO,
                dir: ClientMetricReportDirection_1.default.UPSTREAM,
            },
            videoUpstreamRoundTripTimeMs: {
                source: 'roundTripTime',
                media: ClientMetricReportMediaType_1.default.VIDEO,
                dir: ClientMetricReportDirection_1.default.UPSTREAM,
            },
            videoDownstreamBitrate: {
                source: 'bytesReceived',
                media: ClientMetricReportMediaType_1.default.VIDEO,
                dir: ClientMetricReportDirection_1.default.DOWNSTREAM,
            },
            videoDownstreamPacketLossPercent: {
                source: 'packetsLost',
                media: ClientMetricReportMediaType_1.default.VIDEO,
                dir: ClientMetricReportDirection_1.default.DOWNSTREAM,
            },
            videoDownstreamPacketsReceived: {
                source: 'packetsReceived',
                media: ClientMetricReportMediaType_1.default.VIDEO,
                dir: ClientMetricReportDirection_1.default.DOWNSTREAM,
            },
            videoDownstreamFramesDecodedPerSecond: {
                source: 'framesDecoded',
                media: ClientMetricReportMediaType_1.default.VIDEO,
                dir: ClientMetricReportDirection_1.default.DOWNSTREAM,
            },
            videoDownstreamFrameHeight: {
                source: 'frameHeight',
                media: ClientMetricReportMediaType_1.default.VIDEO,
                dir: ClientMetricReportDirection_1.default.DOWNSTREAM,
            },
            videoDownstreamFrameWidth: {
                source: 'frameWidth',
                media: ClientMetricReportMediaType_1.default.VIDEO,
                dir: ClientMetricReportDirection_1.default.DOWNSTREAM,
            },
            videoDownstreamJitterMs: {
                source: 'jitter',
                media: ClientMetricReportMediaType_1.default.VIDEO,
                dir: ClientMetricReportDirection_1.default.DOWNSTREAM,
            },
            videoDownstreamDelayMs: {
                source: 'jitterBufferMs',
                media: ClientMetricReportMediaType_1.default.VIDEO,
                dir: ClientMetricReportDirection_1.default.DOWNSTREAM,
            },
        };
        /**
         * Observable metrics and related APIs
         */
        this.observableMetricSpec = {
            audioPacketsReceived: {
                source: 'packetsReceived',
                media: ClientMetricReportMediaType_1.default.AUDIO,
                dir: ClientMetricReportDirection_1.default.DOWNSTREAM,
            },
            audioPacketsReceivedFractionLoss: {
                source: 'packetsLost',
                media: ClientMetricReportMediaType_1.default.AUDIO,
                dir: ClientMetricReportDirection_1.default.DOWNSTREAM,
            },
            audioDecoderLoss: {
                source: 'decoderLoss',
                media: ClientMetricReportMediaType_1.default.AUDIO,
                dir: ClientMetricReportDirection_1.default.DOWNSTREAM,
            },
            audioPacketsSent: {
                source: 'packetsSent',
                media: ClientMetricReportMediaType_1.default.AUDIO,
                dir: ClientMetricReportDirection_1.default.UPSTREAM,
            },
            audioPacketLossPercent: {
                source: 'packetsLost',
                media: ClientMetricReportMediaType_1.default.AUDIO,
                dir: ClientMetricReportDirection_1.default.UPSTREAM,
            },
            audioUpstreamRoundTripTimeMs: {
                source: 'roundTripTime',
                media: ClientMetricReportMediaType_1.default.AUDIO,
                dir: ClientMetricReportDirection_1.default.UPSTREAM,
            },
            videoUpstreamBitrate: { source: 'bytesSent', media: ClientMetricReportMediaType_1.default.VIDEO, dir: ClientMetricReportDirection_1.default.UPSTREAM },
            videoPacketSentPerSecond: {
                source: 'packetsSent',
                media: ClientMetricReportMediaType_1.default.VIDEO,
                dir: ClientMetricReportDirection_1.default.UPSTREAM,
            },
            audioSpeakerDelayMs: {
                source: 'jitterBufferMs',
                media: ClientMetricReportMediaType_1.default.AUDIO,
                dir: ClientMetricReportDirection_1.default.DOWNSTREAM,
            },
            audioUpstreamJitterMs: {
                source: 'jitter',
                media: ClientMetricReportMediaType_1.default.AUDIO,
                dir: ClientMetricReportDirection_1.default.UPSTREAM,
            },
            audioDownstreamJitterMs: {
                source: 'jitter',
                media: ClientMetricReportMediaType_1.default.AUDIO,
                dir: ClientMetricReportDirection_1.default.DOWNSTREAM,
            },
            nackCountReceivedPerSecond: {
                source: 'nackCount',
                media: ClientMetricReportMediaType_1.default.VIDEO,
                dir: ClientMetricReportDirection_1.default.UPSTREAM,
            },
            availableOutgoingBitrate: { source: 'availableOutgoingBitrate' },
            availableIncomingBitrate: { source: 'availableIncomingBitrate' },
            currentRoundTripTimeMs: { source: 'currentRoundTripTime' },
        };
    }
    getMetricMap(mediaType, direction) {
        switch (mediaType) {
            case ClientMetricReportMediaType_1.default.AUDIO:
                switch (direction) {
                    case ClientMetricReportDirection_1.default.UPSTREAM:
                        return this.audioUpstreamMetricMap;
                    case ClientMetricReportDirection_1.default.DOWNSTREAM:
                        return this.audioDownstreamMetricMap;
                }
            case ClientMetricReportMediaType_1.default.VIDEO:
                switch (direction) {
                    case ClientMetricReportDirection_1.default.UPSTREAM:
                        return this.videoUpstreamMetricMap;
                    case ClientMetricReportDirection_1.default.DOWNSTREAM:
                        return this.videoDownstreamMetricMap;
                }
            default:
                return this.globalMetricMap;
        }
    }
    /**
     * Returns the value of the specific metric in observableMetricSpec.
     */
    getObservableMetricValue(metricName) {
        const observableMetricSpec = this.observableMetricSpec[metricName];
        const metricMap = this.getMetricMap(observableMetricSpec.media, observableMetricSpec.dir);
        const metricSpec = metricMap[observableMetricSpec.source];
        const { transform, source } = metricSpec;
        if (observableMetricSpec.hasOwnProperty('media')) {
            for (const ssrc in this.streamMetricReports) {
                const streamMetricReport = this.streamMetricReports[ssrc];
                if (streamMetricReport.direction === observableMetricSpec.dir &&
                    streamMetricReport.mediaType === observableMetricSpec.media) {
                    return source
                        ? transform(source, Number(ssrc))
                        : transform(observableMetricSpec.source, Number(ssrc));
                }
            }
        }
        else {
            return source ? transform(source) : transform(observableMetricSpec.source);
        }
        return 0;
    }
    /**
     * Returns the value of the specific metric in observableVideoMetricSpec.
     */
    getObservableVideoMetricValue(metricName, ssrcNum) {
        const observableVideoMetricSpec = this.observableVideoMetricSpec[metricName];
        const metricMap = this.getMetricMap(observableVideoMetricSpec.media, observableVideoMetricSpec.dir);
        const metricSpec = metricMap[observableVideoMetricSpec.source];
        const { transform, source } = metricSpec;
        return source
            ? transform(source, ssrcNum)
            : transform(observableVideoMetricSpec.source, ssrcNum);
    }
    /**
     * Returns the value of metrics in observableMetricSpec.
     */
    getObservableMetrics() {
        const metric = {};
        for (const metricName in this.observableMetricSpec) {
            metric[metricName] = this.getObservableMetricValue(metricName);
        }
        return metric;
    }
    /**
     * Returns the value of metrics in observableVideoMetricSpec for each SSRC.
     */
    getObservableVideoMetrics() {
        const videoStreamMetrics = {};
        if (!this.videoStreamIndex || !this.selfAttendeeId) {
            this.logger.error('Need to define VideoStreamIndex and selfAttendeeId if using getObservableVideoMetrics API');
            return videoStreamMetrics;
        }
        for (const ssrc in this.streamMetricReports) {
            if (this.streamMetricReports[ssrc].mediaType === ClientMetricReportMediaType_1.default.VIDEO) {
                const metric = {};
                for (const metricName in this.observableVideoMetricSpec) {
                    if (this.observableVideoMetricSpec[metricName].dir ===
                        this.streamMetricReports[ssrc].direction) {
                        const metricValue = this.getObservableVideoMetricValue(metricName, Number(ssrc));
                        if (!isNaN(metricValue)) {
                            metric[metricName] = metricValue;
                        }
                    }
                }
                const streamId = this.streamMetricReports[ssrc].streamId;
                const attendeeId = streamId
                    ? this.videoStreamIndex.attendeeIdForStreamId(streamId)
                    : this.selfAttendeeId;
                videoStreamMetrics[attendeeId] = videoStreamMetrics[attendeeId]
                    ? videoStreamMetrics[attendeeId]
                    : {};
                videoStreamMetrics[attendeeId][ssrc] = metric;
            }
        }
        return videoStreamMetrics;
    }
    /**
     * Returns the raw RTCStatsReport from RTCPeerConnection.getStats() API.
     */
    getRTCStatsReport() {
        return this.rtcStatsReport;
    }
    /**
     * Clones the ClientMetricReport and returns it.
     */
    clone() {
        const cloned = new ClientMetricReport(this.logger, this.videoStreamIndex, this.selfAttendeeId);
        cloned.globalMetricReport = this.globalMetricReport;
        cloned.streamMetricReports = this.streamMetricReports;
        cloned.rtcStatsReport = this.rtcStatsReport;
        cloned.currentTimestampMs = this.currentTimestampMs;
        cloned.previousTimestampMs = this.previousTimestampMs;
        return cloned;
    }
    /**
     * Prints out the globalMetricReport, streamMetricReports and the corresponding timestamps from the current ClientMetricReport.
     */
    print() {
        const clientMetricReport = {
            globalMetricReport: this.globalMetricReport,
            streamMetricReports: this.streamMetricReports,
            currentTimestampMs: this.currentTimestampMs,
            previousTimestampMs: this.previousTimestampMs,
        };
        this.logger.debug(() => {
            return `Client Metric Report: ${JSON.stringify(clientMetricReport)}`;
        });
    }
    /**
     * Removes the SSRCs that are no longer valid.
     */
    removeDestroyedSsrcs() {
        for (const ssrc in this.streamMetricReports) {
            if (!this.currentSsrcs[ssrc]) {
                delete this.streamMetricReports[ssrc];
            }
        }
    }
}
exports.default = ClientMetricReport;
//# sourceMappingURL=ClientMetricReport.js.map