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
const VideoTransformDevice_1 = require("../devicecontroller/VideoTransformDevice");
class DefaultAudioVideoFacade {
    constructor(audioVideoController, videoTileController, realtimeController, audioMixController, deviceController, contentShareController) {
        this.audioVideoController = audioVideoController;
        this.videoTileController = videoTileController;
        this.realtimeController = realtimeController;
        this.audioMixController = audioMixController;
        this.deviceController = deviceController;
        this.contentShareController = contentShareController;
    }
    addObserver(observer) {
        this.audioVideoController.addObserver(observer);
        this.trace('addObserver');
    }
    removeObserver(observer) {
        this.audioVideoController.removeObserver(observer);
        this.trace('removeObserver');
    }
    setAudioProfile(audioProfile) {
        this.trace('setAudioProfile', audioProfile);
        this.audioVideoController.setAudioProfile(audioProfile);
    }
    start(options) {
        this.audioVideoController.start(options);
        this.trace('start');
    }
    stop() {
        this.audioVideoController.stop();
        this.trace('stop');
    }
    /**
     * This API will be deprecated in favor of `ClientMetricReport.getRTCStatsReport()`.
     *
     * It makes an additional call to the `getStats` API and therefore may cause slight performance degradation.
     *
     * Please subscribe to `metricsDidReceive(clientMetricReport: ClientMetricReport)` callback,
     * and get the raw `RTCStatsReport` via `clientMetricReport.getRTCStatsReport()`.
     */
    getRTCPeerConnectionStats(selector) {
        this.trace('getRTCPeerConnectionStats', selector ? selector.id : null);
        return this.audioVideoController.getRTCPeerConnectionStats(selector);
    }
    bindAudioElement(element) {
        const result = this.audioMixController.bindAudioElement(element);
        this.trace('bindAudioElement', element.id, result);
        return result;
    }
    unbindAudioElement() {
        this.audioMixController.unbindAudioElement();
        this.trace('unbindAudioElement');
    }
    getCurrentMeetingAudioStream() {
        this.trace('getCurrentConferenceStream');
        return this.audioMixController.getCurrentMeetingAudioStream();
    }
    addAudioMixObserver(observer) {
        this.trace('addAudioMixObserver');
        this.audioMixController.addAudioMixObserver(observer);
    }
    removeAudioMixObserver(observer) {
        this.trace('removeAudioMixObserver');
        this.audioMixController.removeAudioMixObserver(observer);
    }
    bindVideoElement(tileId, videoElement) {
        this.videoTileController.bindVideoElement(tileId, videoElement);
        this.trace('bindVideoElement', { tileId: tileId, videoElementId: videoElement.id });
    }
    unbindVideoElement(tileId, cleanUpVideoElement = true) {
        this.videoTileController.unbindVideoElement(tileId, cleanUpVideoElement);
        this.trace('unbindVideoElement', { tileId: tileId, cleanUpVideoElement: cleanUpVideoElement });
    }
    startLocalVideoTile() {
        const result = this.videoTileController.startLocalVideoTile();
        this.trace('startLocalVideoTile', null, result);
        return result;
    }
    stopLocalVideoTile() {
        this.videoTileController.stopLocalVideoTile();
        this.trace('stopLocalVideoTile');
    }
    hasStartedLocalVideoTile() {
        const result = this.videoTileController.hasStartedLocalVideoTile();
        this.trace('hasStartedLocalVideoTile', null, result);
        return result;
    }
    removeLocalVideoTile() {
        this.videoTileController.removeLocalVideoTile();
        this.trace('removeLocalVideoTile');
    }
    getLocalVideoTile() {
        const result = this.videoTileController.getLocalVideoTile();
        this.trace('getLocalVideoTile');
        return result;
    }
    pauseVideoTile(tileId) {
        this.videoTileController.pauseVideoTile(tileId);
        this.trace('pauseVideoTile', tileId);
    }
    unpauseVideoTile(tileId) {
        this.videoTileController.unpauseVideoTile(tileId);
        this.trace('unpauseVideoTile', tileId);
    }
    getVideoTile(tileId) {
        const result = this.videoTileController.getVideoTile(tileId);
        this.trace('getVideoTile', tileId);
        return result;
    }
    getAllRemoteVideoTiles() {
        const result = this.videoTileController.getAllRemoteVideoTiles();
        this.trace('getAllRemoteVideoTiles');
        return result;
    }
    getAllVideoTiles() {
        const result = this.videoTileController.getAllVideoTiles();
        this.trace('getAllVideoTiles');
        return result;
    }
    addVideoTile() {
        const result = this.videoTileController.addVideoTile();
        this.trace('addVideoTile', null, result.state());
        return result;
    }
    removeVideoTile(tileId) {
        this.videoTileController.removeVideoTile(tileId);
        this.trace('removeVideoTile', tileId);
    }
    removeVideoTilesByAttendeeId(attendeeId) {
        const result = this.videoTileController.removeVideoTilesByAttendeeId(attendeeId);
        this.trace('removeVideoTilesByAttendeeId', attendeeId, result);
        return result;
    }
    removeAllVideoTiles() {
        this.videoTileController.removeAllVideoTiles();
        this.trace('removeAllVideoTiles');
    }
    captureVideoTile(tileId) {
        const result = this.videoTileController.captureVideoTile(tileId);
        this.trace('captureVideoTile', tileId);
        return result;
    }
    realtimeSubscribeToAttendeeIdPresence(callback) {
        this.realtimeController.realtimeSubscribeToAttendeeIdPresence(callback);
        this.trace('realtimeSubscribeToAttendeeIdPresence');
    }
    realtimeUnsubscribeToAttendeeIdPresence(callback) {
        this.realtimeController.realtimeUnsubscribeToAttendeeIdPresence(callback);
        this.trace('realtimeUnsubscribeToAttendeeIdPresence');
    }
    realtimeSetCanUnmuteLocalAudio(canUnmute) {
        this.realtimeController.realtimeSetCanUnmuteLocalAudio(canUnmute);
        this.trace('realtimeSetCanUnmuteLocalAudio', canUnmute);
    }
    realtimeSubscribeToSetCanUnmuteLocalAudio(callback) {
        this.realtimeController.realtimeSubscribeToSetCanUnmuteLocalAudio(callback);
        this.trace('realtimeSubscribeToSetCanUnmuteLocalAudio');
    }
    realtimeUnsubscribeToSetCanUnmuteLocalAudio(callback) {
        this.realtimeController.realtimeUnsubscribeToSetCanUnmuteLocalAudio(callback);
    }
    realtimeCanUnmuteLocalAudio() {
        const result = this.realtimeController.realtimeCanUnmuteLocalAudio();
        this.trace('realtimeCanUnmuteLocalAudio', null, result);
        return result;
    }
    realtimeMuteLocalAudio() {
        this.realtimeController.realtimeMuteLocalAudio();
        this.trace('realtimeMuteLocalAudio');
    }
    realtimeUnmuteLocalAudio() {
        const result = this.realtimeController.realtimeUnmuteLocalAudio();
        this.trace('realtimeUnmuteLocalAudio');
        return result;
    }
    realtimeSubscribeToMuteAndUnmuteLocalAudio(callback) {
        this.realtimeController.realtimeSubscribeToMuteAndUnmuteLocalAudio(callback);
        this.trace('realtimeSubscribeToMuteAndUnmuteLocalAudio');
    }
    realtimeUnsubscribeToMuteAndUnmuteLocalAudio(callback) {
        this.realtimeController.realtimeUnsubscribeToMuteAndUnmuteLocalAudio(callback);
    }
    realtimeIsLocalAudioMuted() {
        const result = this.realtimeController.realtimeIsLocalAudioMuted();
        this.trace('realtimeIsLocalAudioMuted');
        return result;
    }
    realtimeSubscribeToVolumeIndicator(attendeeId, callback) {
        this.realtimeController.realtimeSubscribeToVolumeIndicator(attendeeId, callback);
        this.trace('realtimeSubscribeToVolumeIndicator', attendeeId);
    }
    realtimeUnsubscribeFromVolumeIndicator(attendeeId, callback) {
        this.realtimeController.realtimeUnsubscribeFromVolumeIndicator(attendeeId, callback);
        this.trace('realtimeUnsubscribeFromVolumeIndicator', attendeeId, callback);
    }
    realtimeSubscribeToLocalSignalStrengthChange(callback) {
        this.realtimeController.realtimeSubscribeToLocalSignalStrengthChange(callback);
        this.trace('realtimeSubscribeToLocalSignalStrengthChange');
    }
    realtimeUnsubscribeToLocalSignalStrengthChange(callback) {
        this.realtimeController.realtimeUnsubscribeToLocalSignalStrengthChange(callback);
        this.trace('realtimeUnsubscribeToLocalSignalStrengthChange');
    }
    realtimeSendDataMessage(topic, // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data, lifetimeMs) {
        this.realtimeController.realtimeSendDataMessage(topic, data, lifetimeMs);
        this.trace('realtimeSendDataMessage');
    }
    realtimeSubscribeToReceiveDataMessage(topic, callback) {
        this.realtimeController.realtimeSubscribeToReceiveDataMessage(topic, callback);
        this.trace('realtimeSubscribeToReceiveDataMessage');
    }
    realtimeUnsubscribeFromReceiveDataMessage(topic) {
        this.realtimeController.realtimeUnsubscribeFromReceiveDataMessage(topic);
        this.trace('realtimeUnsubscribeFromReceiveDataMessage');
    }
    realtimeSubscribeToFatalError(callback) {
        this.realtimeController.realtimeSubscribeToFatalError(callback);
    }
    realtimeUnsubscribeToFatalError(callback) {
        this.realtimeController.realtimeUnsubscribeToFatalError(callback);
    }
    subscribeToActiveSpeakerDetector(policy, callback, scoresCallback, scoresCallbackIntervalMs) {
        this.audioVideoController.activeSpeakerDetector.subscribe(policy, callback, scoresCallback, scoresCallbackIntervalMs);
        this.trace('subscribeToActiveSpeakerDetector');
    }
    unsubscribeFromActiveSpeakerDetector(callback) {
        this.audioVideoController.activeSpeakerDetector.unsubscribe(callback);
        this.trace('unsubscribeFromActiveSpeakerDetector');
    }
    listAudioInputDevices(forceUpdate = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.deviceController.listAudioInputDevices(forceUpdate);
            this.trace('listAudioInputDevices', forceUpdate, result);
            return result;
        });
    }
    listVideoInputDevices(forceUpdate = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.deviceController.listVideoInputDevices(forceUpdate);
            this.trace('listVideoInputDevices', forceUpdate, result);
            return result;
        });
    }
    listAudioOutputDevices(forceUpdate = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.deviceController.listAudioOutputDevices(forceUpdate);
            this.trace('listAudioOutputDevices', forceUpdate, result);
            return result;
        });
    }
    startAudioInput(device) {
        return __awaiter(this, void 0, void 0, function* () {
            this.trace('startAudioInput', device);
            return this.deviceController.startAudioInput(device);
        });
    }
    stopAudioInput() {
        return __awaiter(this, void 0, void 0, function* () {
            this.trace('stopAudioInput');
            return this.deviceController.stopAudioInput();
        });
    }
    startVideoInput(device) {
        return __awaiter(this, void 0, void 0, function* () {
            if (VideoTransformDevice_1.isVideoTransformDevice(device)) {
                // Don't stringify the device to avoid failures when cyclic object references are present.
                this.trace('startVideoInput with transform device');
            }
            else {
                this.trace('startVideoInput', device);
            }
            return this.deviceController.startVideoInput(device);
        });
    }
    stopVideoInput() {
        return __awaiter(this, void 0, void 0, function* () {
            this.trace('stopVideoInput');
            return this.deviceController.stopVideoInput();
        });
    }
    chooseAudioOutput(deviceId) {
        const result = this.deviceController.chooseAudioOutput(deviceId);
        this.trace('chooseAudioOutput', deviceId);
        return result;
    }
    addDeviceChangeObserver(observer) {
        this.deviceController.addDeviceChangeObserver(observer);
        this.trace('addDeviceChangeObserver');
    }
    removeDeviceChangeObserver(observer) {
        this.deviceController.removeDeviceChangeObserver(observer);
        this.trace('removeDeviceChangeObserver');
    }
    createAnalyserNodeForAudioInput() {
        const result = this.deviceController.createAnalyserNodeForAudioInput();
        this.trace('createAnalyserNodeForAudioInput');
        return result;
    }
    startVideoPreviewForVideoInput(element) {
        this.deviceController.startVideoPreviewForVideoInput(element);
        this.trace('startVideoPreviewForVideoInput', element.id);
    }
    stopVideoPreviewForVideoInput(element) {
        this.deviceController.stopVideoPreviewForVideoInput(element);
        this.trace('stopVideoPreviewForVideoInput', element.id);
    }
    setDeviceLabelTrigger(trigger) {
        this.deviceController.setDeviceLabelTrigger(trigger);
        this.trace('setDeviceLabelTrigger');
    }
    mixIntoAudioInput(stream) {
        const result = this.deviceController.mixIntoAudioInput(stream);
        this.trace('mixIntoAudioInput', stream.id);
        return result;
    }
    chooseVideoInputQuality(width, height, frameRate) {
        this.deviceController.chooseVideoInputQuality(width, height, frameRate);
        this.trace('chooseVideoInputQuality', {
            width: width,
            height: height,
            frameRate: frameRate,
        });
    }
    setVideoMaxBandwidthKbps(maxBandwidthKbps) {
        this.audioVideoController.setVideoMaxBandwidthKbps(maxBandwidthKbps);
        this.trace('setVideoMaxBandwidthKbps', maxBandwidthKbps);
    }
    getVideoInputQualitySettings() {
        const result = this.deviceController.getVideoInputQualitySettings();
        this.trace('getVideoInputQualitySettings');
        return result;
    }
    setContentAudioProfile(audioProfile) {
        this.trace('setContentAudioProfile', audioProfile);
        this.contentShareController.setContentAudioProfile(audioProfile);
    }
    startContentShare(stream) {
        const result = this.contentShareController.startContentShare(stream);
        this.trace('startContentShare');
        return result;
    }
    startContentShareFromScreenCapture(sourceId, frameRate) {
        const result = this.contentShareController.startContentShareFromScreenCapture(sourceId, frameRate);
        this.trace('startContentShareFromScreenCapture');
        return result;
    }
    pauseContentShare() {
        this.contentShareController.pauseContentShare();
        this.trace('pauseContentShare');
    }
    unpauseContentShare() {
        this.contentShareController.unpauseContentShare();
        this.trace('unpauseContentShare');
    }
    stopContentShare() {
        this.contentShareController.stopContentShare();
        this.trace('stopContentShare');
    }
    addContentShareObserver(observer) {
        this.contentShareController.addContentShareObserver(observer);
        this.trace('addContentShareObserver');
    }
    removeContentShareObserver(observer) {
        this.contentShareController.removeContentShareObserver(observer);
        this.trace('removeContentShareObserver');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trace(name, input, output) {
        const meetingId = this.audioVideoController.configuration.meetingId;
        const attendeeId = this.audioVideoController.configuration.credentials.attendeeId;
        let s = `API/DefaultAudioVideoFacade/${meetingId}/${attendeeId}/${name}`;
        if (typeof input !== 'undefined') {
            s += ` ${JSON.stringify(input)}`;
        }
        if (typeof output !== 'undefined') {
            s += ` -> ${JSON.stringify(output)}`;
        }
        this.audioVideoController.logger.info(s);
    }
    getRemoteVideoSources() {
        const result = this.audioVideoController.getRemoteVideoSources();
        this.trace('getRemoteVideoSources', null, result);
        return result;
    }
    get transcriptionController() {
        return this.realtimeController.transcriptionController;
    }
    promoteToPrimaryMeeting(credentials) {
        this.audioVideoController.removeObserver(this); // Avoid adding multiple times
        this.audioVideoController.addObserver(this); // See note in `audioVideoWasDemotedFromPrimaryMeeting`
        const result = this.audioVideoController.promoteToPrimaryMeeting(credentials);
        this.trace('promoteToPrimaryMeeting', null, result); // Don't trace credentials
        return result;
    }
    demoteFromPrimaryMeeting() {
        this.trace('demoteFromPrimaryMeeting');
        this.audioVideoController.demoteFromPrimaryMeeting();
    }
    audioVideoWasDemotedFromPrimaryMeeting(_) {
        // `DefaultContentShareController` currently does not respond to the connection ending
        // so `contentShareDidStop` will not be called even if backend cleans up the connection.
        // Thus we try to pre-emptively clean up on client side.
        this.contentShareController.stopContentShare();
        this.audioVideoController.removeObserver(this);
    }
}
exports.default = DefaultAudioVideoFacade;
//# sourceMappingURL=DefaultAudioVideoFacade.js.map