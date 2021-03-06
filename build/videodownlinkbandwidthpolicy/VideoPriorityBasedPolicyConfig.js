"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * [[VideoPriorityBasedPolicyConfig]] contains the network issue response delay and network issue recovery delay.
 */
class VideoPriorityBasedPolicyConfig {
    /** Initializes a [[VideoPriorityBasedPolicyConfig]] with the network event delays.
     *
     * @param networkIssueResponseDelayFactor Delays before reducing subscribed video bitrate. Input should be a value between 0 and 1.
     * @param networkIssueRecoveryDelayFactor Delays before starting to increase bitrates after a network event and
     * delays between increasing video bitrates on each individual stream. Input should be a value between 0 and 1.
     */
    constructor(networkIssueResponseDelayFactor = 0, networkIssueRecoveryDelayFactor = 0) {
        this.networkIssueResponseDelayFactor = networkIssueResponseDelayFactor;
        this.networkIssueRecoveryDelayFactor = networkIssueRecoveryDelayFactor;
        this.currentNetworkEvent = 0 /* Stable */;
        this.bandwidthDecreaseTimestamp = 0; // the last time bandwidth decreases
        this.referenceBitrate = 0;
        if (networkIssueResponseDelayFactor < 0) {
            networkIssueResponseDelayFactor = 0;
        }
        else if (networkIssueResponseDelayFactor > 1) {
            networkIssueResponseDelayFactor = 1;
        }
        this.networkIssueResponseDelayFactor = networkIssueResponseDelayFactor;
        if (networkIssueRecoveryDelayFactor < 0) {
            networkIssueRecoveryDelayFactor = 0;
        }
        else if (networkIssueRecoveryDelayFactor > 1) {
            networkIssueRecoveryDelayFactor = 1;
        }
        this.networkIssueRecoveryDelayFactor = networkIssueRecoveryDelayFactor;
    }
    // determine if subscribe is allowed based on network issue/recovery delays
    allowSubscribe(numberOfParticipants, currentEstimated) {
        let timeBeforeAllowSubscribeMs = 0;
        const previousNetworkEvent = this.currentNetworkEvent;
        if (currentEstimated > this.referenceBitrate) {
            // if bw increases
            this.currentNetworkEvent = 2 /* Increase */;
            this.referenceBitrate = currentEstimated;
            return true;
        }
        else if (currentEstimated < this.referenceBitrate) {
            // if bw decreases, we use response delay
            this.currentNetworkEvent = 1 /* Decrease */;
            timeBeforeAllowSubscribeMs = this.getSubscribeDelay(this.currentNetworkEvent, numberOfParticipants);
            if (previousNetworkEvent !== 1 /* Decrease */) {
                this.bandwidthDecreaseTimestamp = Date.now();
            }
            else if (Date.now() - this.bandwidthDecreaseTimestamp > timeBeforeAllowSubscribeMs) {
                this.referenceBitrate = currentEstimated;
                return true;
            }
            return false;
        }
        else {
            this.currentNetworkEvent = 0 /* Stable */;
            return false;
        }
    }
    // convert network event delay factor to actual delay in ms
    getSubscribeDelay(event, numberOfParticipants) {
        // left and right boundary of the delay
        let subscribeDelay = VideoPriorityBasedPolicyConfig.MINIMUM_DELAY_MS;
        const range = VideoPriorityBasedPolicyConfig.MAXIMUM_DELAY_MS -
            VideoPriorityBasedPolicyConfig.MINIMUM_DELAY_MS;
        const responseFactor = this.networkIssueResponseDelayFactor;
        switch (event) {
            case 1 /* Decrease */:
                // we include number of participants here since bigger size of the meeting will generate higher bitrate
                subscribeDelay += range * responseFactor * (1 + numberOfParticipants / 10);
                subscribeDelay = Math.min(VideoPriorityBasedPolicyConfig.MAXIMUM_DELAY_MS, subscribeDelay);
                break;
        }
        return subscribeDelay;
    }
}
exports.default = VideoPriorityBasedPolicyConfig;
VideoPriorityBasedPolicyConfig.MINIMUM_DELAY_MS = 2000;
VideoPriorityBasedPolicyConfig.MAXIMUM_DELAY_MS = 8000;
// presets
VideoPriorityBasedPolicyConfig.Default = new VideoPriorityBasedPolicyConfig(0, 0);
VideoPriorityBasedPolicyConfig.UnstableNetworkPreset = new VideoPriorityBasedPolicyConfig(0, 1);
VideoPriorityBasedPolicyConfig.StableNetworkPreset = new VideoPriorityBasedPolicyConfig(1, 0);
//# sourceMappingURL=VideoPriorityBasedPolicyConfig.js.map