"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
const Types_1 = require("../utils/Types");
class SignalingAndMetricsConnectionMonitor {
    constructor(audioVideoController, realtimeController, connectionHealthData, pingPong, statsCollector) {
        this.audioVideoController = audioVideoController;
        this.realtimeController = realtimeController;
        this.connectionHealthData = connectionHealthData;
        this.pingPong = pingPong;
        this.statsCollector = statsCollector;
        this.isActive = false;
        this.hasSeenValidPacketMetricsBefore = false;
        this.realtimeController.realtimeSubscribeToLocalSignalStrengthChange((signalStrength) => {
            if (this.isActive) {
                this.receiveSignalStrengthChange(signalStrength);
            }
        });
    }
    start() {
        this.isActive = true;
        this.pingPong.addObserver(this);
        this.pingPong.start();
        this.audioVideoController.addObserver(this);
    }
    stop() {
        this.isActive = false;
        this.pingPong.removeObserver(this);
        this.pingPong.stop();
        this.audioVideoController.removeObserver(this);
    }
    receiveSignalStrengthChange(signalStrength) {
        if (signalStrength === 0) {
            this.connectionHealthData.setLastNoSignalTimestampMs(Date.now());
        }
        else if (signalStrength <= 0.5) {
            this.connectionHealthData.setLastWeakSignalTimestampMs(Date.now());
        }
        else {
            this.connectionHealthData.setLastGoodSignalTimestampMs(Date.now());
        }
        this.updateConnectionHealth();
    }
    didReceivePong(_id, latencyMs, clockSkewMs) {
        this.connectionHealthData.setConsecutiveMissedPongs(0);
        this.statsCollector.logLatency('ping_pong', latencyMs);
        this.statsCollector.logLatency('ping_pong_clock_skew', clockSkewMs);
        this.updateConnectionHealth();
    }
    didMissPongs() {
        this.connectionHealthData.setConsecutiveMissedPongs(this.connectionHealthData.consecutiveMissedPongs + 1);
        this.updateConnectionHealth();
    }
    metricsDidReceive(clientMetricReport) {
        let packetsReceived = 0;
        let fractionPacketsLostInbound = 0;
        const metricReport = clientMetricReport.getObservableMetrics();
        const potentialPacketsReceived = metricReport.audioPacketsReceived;
        const potentialFractionPacketsLostInbound = metricReport.audioPacketsReceivedFractionLoss;
        const audioSpeakerDelayMs = metricReport.audioSpeakerDelayMs;
        // Firefox does not presently have aggregated bandwidth estimation
        if (typeof audioSpeakerDelayMs === 'number' && !isNaN(audioSpeakerDelayMs)) {
            this.connectionHealthData.setAudioSpeakerDelayMs(audioSpeakerDelayMs);
        }
        if (typeof potentialPacketsReceived === 'number' &&
            typeof potentialFractionPacketsLostInbound === 'number') {
            packetsReceived = potentialPacketsReceived;
            fractionPacketsLostInbound = potentialFractionPacketsLostInbound;
            if (packetsReceived < 0 || fractionPacketsLostInbound < 0) {
                // TODO: getting negative numbers on this metric after reconnect sometimes
                // For now, just skip the metric if it looks weird.
                return;
            }
        }
        else {
            return;
        }
        this.addToMinuteWindow(this.connectionHealthData.packetsReceivedInLastMinute, packetsReceived);
        this.addToMinuteWindow(this.connectionHealthData.fractionPacketsLostInboundInLastMinute, fractionPacketsLostInbound);
        if (packetsReceived > 0) {
            this.hasSeenValidPacketMetricsBefore = true;
            this.connectionHealthData.setConsecutiveStatsWithNoPackets(0);
        }
        else if (this.hasSeenValidPacketMetricsBefore) {
            this.connectionHealthData.setConsecutiveStatsWithNoPackets(this.connectionHealthData.consecutiveStatsWithNoPackets + 1);
        }
        if (packetsReceived === 0 || fractionPacketsLostInbound > 0) {
            this.connectionHealthData.setLastPacketLossInboundTimestampMs(Date.now());
        }
        this.updateConnectionHealth();
    }
    addToMinuteWindow(array, value) {
        array.unshift(value);
        if (array.length > 60) {
            array.pop();
        }
    }
    updateConnectionHealth() {
        this.audioVideoController.forEachObserver((observer) => {
            Types_1.Maybe.of(observer.connectionHealthDidChange).map(f => f.bind(observer)(this.connectionHealthData.clone()));
        });
    }
}
exports.default = SignalingAndMetricsConnectionMonitor;
//# sourceMappingURL=SignalingAndMetricsConnectionMonitor.js.map