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
const DefaultBrowserBehavior_1 = require("../browserbehavior/DefaultBrowserBehavior");
const DefaultMediaDeviceFactory_1 = require("../mediadevicefactory/DefaultMediaDeviceFactory");
const AsyncScheduler_1 = require("../scheduler/AsyncScheduler");
const PromiseQueue_1 = require("../utils/PromiseQueue");
const Types_1 = require("../utils/Types");
const DefaultVideoTile_1 = require("../videotile/DefaultVideoTile");
const AudioTransformDevice_1 = require("./AudioTransformDevice");
const DeviceSelection_1 = require("./DeviceSelection");
const GetUserMediaError_1 = require("./GetUserMediaError");
const NotFoundError_1 = require("./NotFoundError");
const NotReadableError_1 = require("./NotReadableError");
const OverconstrainedError_1 = require("./OverconstrainedError");
const PermissionDeniedError_1 = require("./PermissionDeniedError");
const TypeError_1 = require("./TypeError");
const VideoQualitySettings_1 = require("./VideoQualitySettings");
const VideoTransformDevice_1 = require("./VideoTransformDevice");
class DefaultDeviceController {
    constructor(logger, options, browserBehavior = new DefaultBrowserBehavior_1.default(), eventController) {
        this.logger = logger;
        this.browserBehavior = browserBehavior;
        this.eventController = eventController;
        this.deviceInfoCache = null;
        this.activeDevices = { audio: null, video: null };
        // `chosenVideoTransformDevice` is tracked and owned by device controller.
        // It is saved when `chooseVideoInputDevice` is called with VideoTransformDevice object.
        this.chosenVideoTransformDevice = null;
        this.audioOutputDeviceId = undefined;
        this.deviceChangeObservers = new Set();
        this.mediaStreamBrokerObservers = new Set();
        this.deviceLabelTrigger = () => {
            return navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        };
        this.audioInputDestinationNode = null;
        this.audioInputSourceNode = null;
        this.videoInputQualitySettings = null;
        this.useWebAudio = false;
        this.useMediaConstraintsFallback = true;
        this.audioInputTaskQueue = new PromiseQueue_1.default();
        this.videoInputTaskQueue = new PromiseQueue_1.default();
        // This handles the dispatch of `mute` and `unmute` events from audio tracks.
        // There's a bit of a semantic mismatch here if input streams allow individual component tracks to be muted,
        // but addressing that gap is not feasible in our stream-oriented world.
        this.mediaStreamMuteObserver = (id, muted) => {
            for (const observer of this.deviceChangeObservers) {
                AsyncScheduler_1.default.nextTick(() => {
                    /* istanbul ignore else */
                    if (this.deviceChangeObservers.has(observer) && observer.audioInputMuteStateChanged) {
                        observer.audioInputMuteStateChanged(id, muted);
                    }
                });
            }
        };
        this.alreadyHandlingDeviceChange = false;
        const { enableWebAudio = false, useMediaConstraintsFallback = true } = options || {};
        this.useWebAudio = enableWebAudio;
        this.useMediaConstraintsFallback = useMediaConstraintsFallback;
        this.videoInputQualitySettings = new VideoQualitySettings_1.default(DefaultDeviceController.defaultVideoWidth, DefaultDeviceController.defaultVideoHeight, DefaultDeviceController.defaultVideoFrameRate);
        const dimension = this.browserBehavior.requiresResolutionAlignment(this.videoInputQualitySettings.videoWidth, this.videoInputQualitySettings.videoHeight);
        this.videoInputQualitySettings.videoWidth = dimension[0];
        this.videoInputQualitySettings.videoHeight = dimension[1];
        this.logger.info(`DefaultDeviceController video dimension ${this.videoInputQualitySettings.videoWidth} x ${this.videoInputQualitySettings.videoHeight}`);
        try {
            this.mediaDeviceWrapper = new DefaultMediaDeviceFactory_1.default().create();
            const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
            this.logger.info(`Supported Constraints in this browser ${JSON.stringify(supportedConstraints)}`);
        }
        catch (error) {
            logger.error(error.message);
        }
    }
    isWatchingForDeviceChanges() {
        return !!this.onDeviceChangeCallback;
    }
    ensureWatchingDeviceChanges() {
        var _a;
        if (this.isWatchingForDeviceChanges()) {
            return;
        }
        this.logger.info('Starting devicechange listener.');
        this.onDeviceChangeCallback = () => {
            this.logger.info('Device change event callback is triggered');
            this.handleDeviceChange();
        };
        (_a = this.mediaDeviceWrapper) === null || _a === void 0 ? void 0 : _a.addEventListener('devicechange', this.onDeviceChangeCallback);
    }
    /**
     * Unsubscribe from the `devicechange` event, which allows the device controller to
     * update its device cache.
     */
    stopWatchingDeviceChanges() {
        var _a;
        if (!this.isWatchingForDeviceChanges()) {
            return;
        }
        this.logger.info('Stopping devicechange listener.');
        (_a = this.mediaDeviceWrapper) === null || _a === void 0 ? void 0 : _a.removeEventListener('devicechange', this.onDeviceChangeCallback);
        this.onDeviceChangeCallback = undefined;
    }
    shouldObserveDeviceChanges() {
        if (this.deviceChangeObservers.size) {
            return true;
        }
        const hasActiveDevices = (this.activeDevices['audio'] && this.activeDevices['audio'].constraints !== null) ||
            (this.activeDevices['video'] && this.activeDevices['video'].constraints !== null) ||
            !!this.audioOutputDeviceId;
        return hasActiveDevices;
    }
    watchForDeviceChangesIfNecessary() {
        if (this.shouldObserveDeviceChanges()) {
            this.ensureWatchingDeviceChanges();
        }
        else {
            this.stopWatchingDeviceChanges();
        }
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            // Remove device change callbacks.
            this.stopWatchingDeviceChanges();
            // Deselect any audio input devices and throw away the streams.
            // Discard the current video device, if there is one.
            // Discard any audio or video transforms.
            yield this.stopAudioInput();
            yield this.stopVideoInput();
        });
    }
    listAudioInputDevices(forceUpdate = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.listDevicesOfKind('audioinput', forceUpdate);
            this.trace('listAudioInputDevices', forceUpdate, result);
            return result;
        });
    }
    listVideoInputDevices(forceUpdate = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.listDevicesOfKind('videoinput', forceUpdate);
            this.trace('listVideoInputDevices', forceUpdate, result);
            return result;
        });
    }
    listAudioOutputDevices(forceUpdate = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.listDevicesOfKind('audiooutput', forceUpdate);
            this.trace('listAudioOutputDevices', forceUpdate, result);
            return result;
        });
    }
    pushAudioMeetingStateForPermissions(audioStream) {
        var _a;
        (_a = this.eventController) === null || _a === void 0 ? void 0 : _a.publishEvent(audioStream === undefined ? 'audioInputUnselected' : 'audioInputSelected');
    }
    pushVideoMeetingStateForPermissions(videoStream) {
        var _a;
        (_a = this.eventController) === null || _a === void 0 ? void 0 : _a.publishEvent(videoStream === undefined ? 'videoInputUnselected' : 'videoInputSelected');
    }
    startAudioInput(device) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.audioInputTaskQueue.add(() => this.startAudioInputTask(device));
        });
    }
    startAudioInputTask(device) {
        return __awaiter(this, void 0, void 0, function* () {
            if (device === undefined) {
                this.logger.error('Audio input device cannot be undefined');
                return undefined;
            }
            try {
                if (AudioTransformDevice_1.isAudioTransformDevice(device)) {
                    // N.B., do not JSON.stringify here ?????for some kinds of devices this
                    // will cause a cyclic object reference error.
                    this.logger.info(`Choosing transform input device ${device}`);
                    yield this.chooseAudioTransformInputDevice(device);
                }
                else {
                    this.logger.info(`Choosing intrinsic audio input device ${device}`);
                    this.removeTransform();
                    yield this.chooseInputIntrinsicDevice('audio', device);
                }
                this.trace('startAudioInputDevice', device, `success`);
                // For web audio, the audio destination stream stays the same so audio input did not change
                if (this.useWebAudio) {
                    this.attachAudioInputStreamToAudioContext(this.activeDevices['audio'].stream);
                    this.pushAudioMeetingStateForPermissions(this.getMediaStreamDestinationNode().stream);
                    return this.getMediaStreamDestinationNode().stream;
                }
                else {
                    this.publishAudioInputDidChangeEvent(this.activeDevices['audio'].stream);
                    return this.activeDevices['audio'].stream;
                }
            }
            catch (error) {
                throw error;
            }
        });
    }
    stopAudioInput() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.audioInputTaskQueue.add(() => this.stopAudioInputTask());
        });
    }
    stopAudioInputTask() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.useWebAudio) {
                    this.releaseAudioTransformStream();
                    return;
                }
                this.stopTracksAndRemoveCallbacks('audio');
            }
            finally {
                this.watchForDeviceChangesIfNecessary();
                this.publishAudioInputDidChangeEvent(undefined);
            }
        });
    }
    chooseAudioTransformInputDevice(device) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (((_a = this.transform) === null || _a === void 0 ? void 0 : _a.device) === device) {
                return;
            }
            if (!this.useWebAudio) {
                throw new Error('Cannot apply transform device without enabling Web Audio.');
            }
            const context = DefaultDeviceController.getAudioContext();
            if (context instanceof OfflineAudioContext) {
                // Nothing to do.
            }
            else {
                switch (context.state) {
                    case 'running':
                        // Nothing to do.
                        break;
                    case 'closed':
                        // A closed context cannot be used for creating nodes, so the correct
                        // thing to do is to raise a descriptive error sooner.
                        throw new Error('Cannot choose a transform device with a closed audio context.');
                    case 'suspended':
                        // A context might be suspended after page load. We try to resume it
                        // here, otherwise audio won't work.
                        yield context.resume();
                }
            }
            let nodes;
            try {
                nodes = yield device.createAudioNode(context);
            }
            catch (e) {
                this.logger.error(`Unable to create transform device node: ${e}.`);
                throw e;
            }
            // Pick the plain ol' inner device as the source. It will be
            // connected to the node.
            const inner = yield device.intrinsicDevice();
            yield this.chooseInputIntrinsicDevice('audio', inner);
            this.logger.debug(`Got inner stream: ${inner}.`);
            // Otherwise, continue: hook up the new node.
            this.setTransform(device, nodes);
        });
    }
    chooseVideoTransformInputDevice(device) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (device === this.chosenVideoTransformDevice) {
                this.logger.info('Reselecting same VideoTransformDevice');
                return;
            }
            const prevVideoTransformDevice = this.chosenVideoTransformDevice;
            if (prevVideoTransformDevice) {
                this.logger.info('Switched from previous VideoTransformDevice');
            }
            const wasUsingTransformDevice = !!prevVideoTransformDevice;
            const inner = yield device.intrinsicDevice();
            const canReuseMediaStream = this.isMediaStreamReusableByDeviceId((_a = this.activeDevices['video']) === null || _a === void 0 ? void 0 : _a.stream, inner);
            if (!canReuseMediaStream) {
                this.logger.info('video transform device needs new intrinsic device');
                if (wasUsingTransformDevice) {
                    // detach input media stream - turn off the camera or leave it be if inner is media stream
                    prevVideoTransformDevice.onOutputStreamDisconnect();
                }
                this.chosenVideoTransformDevice = device;
                // VideoTransformDevice owns input MediaStream
                this.activeDevices['video'] = null;
                yield this.chooseInputIntrinsicDevice('video', inner);
                this.logger.info('apply processors to transform');
                yield this.chosenVideoTransformDevice.transformStream(this.activeDevices['video'].stream);
                return;
            }
            // When saved stream is reusable, only switch the saved stream to filtered stream for sending
            // but keep the saved stream intact.
            // Note: to keep the chosen media stream intact, it is important to avoid a full stop
            // because videoTileUpdate can be called when video is stopped and user might call `bindVideoElement` to disconnect the element.
            // In current implementation, disconnecting the element will `hard` stop the media stream.
            // Update device and stream
            this.chosenVideoTransformDevice = device;
            this.logger.info('video transform device uses previous stream');
            // `transformStream` will start processing.
            this.logger.info('apply processors to transform');
            yield device.transformStream(this.activeDevices['video'].stream);
        });
    }
    startVideoInput(device) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.videoInputTaskQueue.add(() => this.startVideoInputTask(device));
        });
    }
    startVideoInputTask(device) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!device) {
                this.logger.error('Invalid video input device');
                return undefined;
            }
            try {
                if (VideoTransformDevice_1.isVideoTransformDevice(device)) {
                    this.logger.info(`Choosing video transform device ${device}`);
                    yield this.chooseVideoTransformInputDevice(device);
                    this.publishVideoInputDidChangeEvent(this.chosenVideoTransformDevice.outputMediaStream);
                    return this.chosenVideoTransformDevice.outputMediaStream;
                }
                // handle direct switching from VideoTransformDevice to Device
                // From WebRTC point, it is a device switching.
                if (this.chosenVideoInputIsTransformDevice()) {
                    // disconnect old stream
                    this.chosenVideoTransformDevice.onOutputStreamDisconnect();
                    this.chosenVideoTransformDevice = null;
                }
                yield this.chooseInputIntrinsicDevice('video', device);
                this.trace('startVideoInputDevice', device);
                this.publishVideoInputDidChangeEvent(this.activeDevices['video'].stream);
                return this.activeDevices['video'].stream;
            }
            catch (error) {
                throw error;
            }
        });
    }
    stopVideoInput() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.videoInputTaskQueue.add(() => this.stopVideoInputTask());
        });
    }
    stopVideoInputTask() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this.chosenVideoInputIsTransformDevice()) {
                    this.releaseVideoTransformStream();
                    return;
                }
                this.stopTracksAndRemoveCallbacks('video');
            }
            finally {
                this.watchForDeviceChangesIfNecessary();
                this.publishVideoInputDidChangeEvent(undefined);
            }
        });
    }
    chooseAudioOutput(deviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.audioOutputDeviceId = deviceId;
            this.watchForDeviceChangesIfNecessary();
            const deviceInfo = this.deviceInfoFromDeviceId('audiooutput', this.audioOutputDeviceId);
            this.publishAudioOutputDidChangeEvent(deviceInfo);
            this.trace('chooseAudioOutput', deviceId, null);
            return;
        });
    }
    addDeviceChangeObserver(observer) {
        this.logger.info('adding device change observer');
        this.deviceChangeObservers.add(observer);
        this.watchForDeviceChangesIfNecessary();
        this.trace('addDeviceChangeObserver');
    }
    removeDeviceChangeObserver(observer) {
        this.logger.info('removing device change observer');
        this.deviceChangeObservers.delete(observer);
        this.watchForDeviceChangesIfNecessary();
        this.trace('removeDeviceChangeObserver');
    }
    createAnalyserNodeForAudioInput() {
        var _a, _b;
        if (!this.activeDevices['audio']) {
            return null;
        }
        // If there is a WebAudio node in the graph, we use that as the source instead of the stream.
        const node = (_b = (_a = this.transform) === null || _a === void 0 ? void 0 : _a.nodes) === null || _b === void 0 ? void 0 : _b.end;
        if (node) {
            const analyser = node.context.createAnalyser();
            analyser.removeOriginalInputs = () => {
                try {
                    node.disconnect(analyser);
                }
                catch (e) {
                    // This can fail in some unusual cases, but this is best-effort.
                }
            };
            node.connect(analyser);
            return analyser;
        }
        return this.createAnalyserNodeForRawAudioInput();
    }
    //
    // N.B., this bypasses any applied transform node.
    //
    createAnalyserNodeForRawAudioInput() {
        if (!this.activeDevices['audio']) {
            return null;
        }
        return this.createAnalyserNodeForStream(this.activeDevices['audio'].stream);
    }
    createAnalyserNodeForStream(stream) {
        const audioContext = DefaultDeviceController.getAudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        this.trace('createAnalyserNodeForAudioInput');
        analyser.removeOriginalInputs = () => {
            try {
                source.disconnect(analyser);
            }
            catch (e) {
                // This can fail in some unusual cases, but this is best-effort.
            }
        };
        return analyser;
    }
    startVideoPreviewForVideoInput(element) {
        if (!this.activeDevices['video']) {
            this.logger.warn('cannot bind video preview since video input device has not been chosen');
            this.trace('startVideoPreviewForVideoInput', element.id);
            return;
        }
        DefaultVideoTile_1.default.connectVideoStreamToVideoElement(this.chosenVideoTransformDevice
            ? this.chosenVideoTransformDevice.outputMediaStream
            : this.activeDevices['video'].stream, element, true);
        this.trace('startVideoPreviewForVideoInput', element.id);
    }
    stopVideoPreviewForVideoInput(element) {
        DefaultVideoTile_1.default.disconnectVideoStreamFromVideoElement(element, false);
        this.trace('stopVideoPreviewForVideoInput', element.id);
    }
    setDeviceLabelTrigger(trigger) {
        // Discard the cache if it was populated with unlabeled devices.
        if (this.deviceInfoCache) {
            for (const device of this.deviceInfoCache) {
                if (!device.label) {
                    this.deviceInfoCache = null;
                    break;
                }
            }
        }
        this.deviceLabelTrigger = trigger;
        this.trace('setDeviceLabelTrigger');
    }
    mixIntoAudioInput(stream) {
        let node = null;
        if (this.useWebAudio) {
            node = DefaultDeviceController.getAudioContext().createMediaStreamSource(stream);
            node.connect(this.getMediaStreamOutputNode());
        }
        else {
            this.logger.warn('WebAudio is not enabled, mixIntoAudioInput will not work');
        }
        this.trace('mixIntoAudioInput', stream.id);
        return node;
    }
    chooseVideoInputQuality(width, height, frameRate) {
        const dimension = this.browserBehavior.requiresResolutionAlignment(width, height);
        this.videoInputQualitySettings = new VideoQualitySettings_1.default(dimension[0], dimension[1], frameRate);
    }
    getVideoInputQualitySettings() {
        return this.videoInputQualitySettings;
    }
    acquireAudioInputStream() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.activeDevices['audio']) {
                this.logger.info(`No audio device chosen, creating empty audio device`);
                yield this.startAudioInput(null);
            }
            if (this.useWebAudio) {
                const dest = this.getMediaStreamDestinationNode();
                return dest.stream;
            }
            return this.activeDevices['audio'].stream;
        });
    }
    acquireVideoInputStream() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.activeDevices['video']) {
                throw new Error(`No video device chosen`);
            }
            if (this.chosenVideoInputIsTransformDevice()) {
                return this.chosenVideoTransformDevice.outputMediaStream;
            }
            return this.activeDevices['video'].stream;
        });
    }
    acquireDisplayInputStream(_streamConstraints) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('unsupported');
        });
    }
    /**
     *
     * We need to do three things to clean up audio input
     *
     * * Close the tracks of the source stream.
     * * Remove the transform.
     * * Clean up the intrinsic stream's callback -- that's the stream that's tracked in
     *   `activeDevices` and needs to have its callbacks removed.
     */
    releaseAudioTransformStream() {
        this.logger.info('Stopping audio track for Web Audio graph');
        this.stopTracksAndRemoveCallbacks('audio');
        this.logger.info('Removing audio transform, if there is one.');
        this.removeTransform();
        // Remove the input and output nodes. They will be recreated later if
        // needed.
        /* istanbul ignore else */
        if (this.audioInputSourceNode) {
            this.audioInputSourceNode.disconnect();
            this.audioInputSourceNode = undefined;
        }
        /* istanbul ignore else */
        if (this.audioInputDestinationNode) {
            this.audioInputDestinationNode.disconnect();
            this.audioInputDestinationNode = undefined;
        }
    }
    /**
     *
     * We need to do three things to clean up video input
     *
     * * Close the tracks of the source stream.
     * * Remove the transform.
     * * Clean up the intrinsic stream's callback -- that's the stream that's tracked in
     *   `activeDevices` and needs to have its callbacks removed.
     */
    releaseVideoTransformStream() {
        this.logger.info('Stopping video track for transform');
        this.stopTracksAndRemoveCallbacks('video');
        this.logger.info('Disconnecting video transform');
        this.chosenVideoTransformDevice.onOutputStreamDisconnect();
        this.chosenVideoTransformDevice = null;
    }
    stopTracksAndRemoveCallbacks(kind) {
        const activeDevice = this.activeDevices[kind];
        // Just-in-case error handling.
        /* istanbul ignore if */
        if (!activeDevice) {
            return;
        }
        /* istanbul ignore next */
        const endedCallback = activeDevice.endedCallback;
        const trackMuteCallback = activeDevice.trackMuteCallback;
        const trackUnmuteCallback = activeDevice.trackUnmuteCallback;
        for (const track of activeDevice.stream.getTracks()) {
            track.stop();
            /* istanbul ignore else */
            if (endedCallback) {
                track.removeEventListener('ended', endedCallback);
            }
            /* istanbul ignore else */
            if (trackMuteCallback) {
                track.removeEventListener('mute', trackMuteCallback);
            }
            /* istanbul ignore else */
            if (trackUnmuteCallback) {
                track.removeEventListener('unmute', trackUnmuteCallback);
            }
            delete activeDevice.endedCallback;
            delete activeDevice.trackMuteCallback;
            delete activeDevice.trackUnmuteCallback;
            delete this.activeDevices[kind];
        }
    }
    chosenVideoInputIsTransformDevice() {
        return !!this.chosenVideoTransformDevice;
    }
    muteLocalAudioInputStream() {
        this.toggleLocalAudioInputStream(false);
    }
    unmuteLocalAudioInputStream() {
        this.toggleLocalAudioInputStream(true);
    }
    toggleLocalAudioInputStream(enabled) {
        var _a;
        if (!this.activeDevices['audio']) {
            return;
        }
        let isChanged = false;
        for (const track of this.activeDevices['audio'].stream.getTracks()) {
            if (track.enabled === enabled) {
                continue;
            }
            track.enabled = enabled;
            isChanged = true;
        }
        if (isChanged) {
            (_a = this.transform) === null || _a === void 0 ? void 0 : _a.device.mute(!enabled);
        }
    }
    static getIntrinsicDeviceId(device) {
        if (!device) {
            return undefined;
        }
        if (typeof device === 'string') {
            return device;
        }
        if (device.id) {
            return device.id;
        }
        const constraints = device;
        const deviceIdConstraints = constraints.deviceId;
        if (!deviceIdConstraints) {
            return undefined;
        }
        if (typeof deviceIdConstraints === 'string' || Array.isArray(deviceIdConstraints)) {
            return deviceIdConstraints;
        }
        const constraintStringParams = deviceIdConstraints;
        if (typeof constraintStringParams.exact === 'string' ||
            Array.isArray(constraintStringParams.exact)) {
            return constraintStringParams.exact;
        }
        return undefined;
    }
    static createEmptyAudioDevice() {
        return DefaultDeviceController.synthesizeAudioDevice(0);
    }
    static synthesizeAudioDevice(toneHz) {
        const audioContext = DefaultDeviceController.getAudioContext();
        const outputNode = audioContext.createMediaStreamDestination();
        if (!toneHz) {
            const source = audioContext.createBufferSource();
            // The AudioContext object uses the sample rate of the default output device
            // if not specified. Creating an AudioBuffer object with the output device's
            // sample rate fails in some browsers, e.g. Safari with a Bluetooth headphone.
            try {
                source.buffer = audioContext.createBuffer(1, audioContext.sampleRate * 5, audioContext.sampleRate);
            }
            catch (error) {
                if (error && error.name === 'NotSupportedError') {
                    source.buffer = audioContext.createBuffer(1, DefaultDeviceController.defaultSampleRate * 5, DefaultDeviceController.defaultSampleRate);
                }
                else {
                    throw error;
                }
            }
            // Some browsers will not play audio out the MediaStreamDestination
            // unless there is actually audio to play, so we add a small amount of
            // noise here to ensure that audio is played out.
            source.buffer.getChannelData(0)[0] = 0.0003;
            source.loop = true;
            source.connect(outputNode);
            source.start();
        }
        else {
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0.1;
            gainNode.connect(outputNode);
            const oscillatorNode = audioContext.createOscillator();
            oscillatorNode.frequency.value = toneHz;
            oscillatorNode.connect(gainNode);
            oscillatorNode.start();
        }
        return outputNode.stream;
    }
    listDevicesOfKind(deviceKind, forceUpdate) {
        return __awaiter(this, void 0, void 0, function* () {
            if (forceUpdate || this.deviceInfoCache === null || !this.isWatchingForDeviceChanges()) {
                yield this.updateDeviceInfoCacheFromBrowser();
            }
            return this.listCachedDevicesOfKind(deviceKind);
        });
    }
    updateDeviceInfoCacheFromBrowser() {
        return __awaiter(this, void 0, void 0, function* () {
            const doesNotHaveAccessToMediaDevices = typeof MediaDeviceInfo === 'undefined';
            if (doesNotHaveAccessToMediaDevices) {
                this.deviceInfoCache = [];
                return;
            }
            let devices = yield navigator.mediaDevices.enumerateDevices();
            let hasDeviceLabels = true;
            for (const device of devices) {
                if (!device.label) {
                    hasDeviceLabels = false;
                    break;
                }
            }
            if (!hasDeviceLabels) {
                try {
                    this.logger.info('attempting to trigger media device labels since they are hidden');
                    const triggerStream = yield this.deviceLabelTrigger();
                    devices = yield navigator.mediaDevices.enumerateDevices();
                    for (const track of triggerStream.getTracks()) {
                        track.stop();
                    }
                }
                catch (err) {
                    this.logger.info('unable to get media device labels');
                }
            }
            this.logger.debug(`Update device info cache with devices: ${JSON.stringify(devices)}`);
            this.deviceInfoCache = devices;
        });
    }
    listCachedDevicesOfKind(deviceKind) {
        const devicesOfKind = [];
        if (this.deviceInfoCache) {
            for (const device of this.deviceInfoCache) {
                if (device.kind === deviceKind) {
                    devicesOfKind.push(device);
                }
            }
        }
        return devicesOfKind;
    }
    handleDeviceChange() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.deviceInfoCache === null) {
                return;
            }
            if (this.alreadyHandlingDeviceChange) {
                AsyncScheduler_1.default.nextTick(() => {
                    this.handleDeviceChange();
                });
                return;
            }
            this.alreadyHandlingDeviceChange = true;
            const oldAudioInputDevices = this.listCachedDevicesOfKind('audioinput');
            const oldVideoInputDevices = this.listCachedDevicesOfKind('videoinput');
            const oldAudioOutputDevices = this.listCachedDevicesOfKind('audiooutput');
            yield this.updateDeviceInfoCacheFromBrowser();
            const newAudioInputDevices = this.listCachedDevicesOfKind('audioinput');
            const newVideoInputDevices = this.listCachedDevicesOfKind('videoinput');
            const newAudioOutputDevices = this.listCachedDevicesOfKind('audiooutput');
            this.forEachObserver((observer) => {
                if (!this.areDeviceListsEqual(oldAudioInputDevices, newAudioInputDevices)) {
                    Types_1.Maybe.of(observer.audioInputsChanged).map(f => f.bind(observer)(newAudioInputDevices));
                }
                if (!this.areDeviceListsEqual(oldVideoInputDevices, newVideoInputDevices)) {
                    Types_1.Maybe.of(observer.videoInputsChanged).map(f => f.bind(observer)(newVideoInputDevices));
                }
                if (!this.areDeviceListsEqual(oldAudioOutputDevices, newAudioOutputDevices)) {
                    Types_1.Maybe.of(observer.audioOutputsChanged).map(f => f.bind(observer)(newAudioOutputDevices));
                }
            });
            this.alreadyHandlingDeviceChange = false;
        });
    }
    handleDeviceStreamEnded(kind, deviceId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (kind === 'audio') {
                    this.logger.warn(`Audio input device which was active is no longer available, resetting to null device`);
                    yield this.startAudioInput(null); //Need to switch to empty audio device
                }
                else {
                    this.logger.warn(`Video input device which was active is no longer available, stopping video`);
                    yield this.stopVideoInput();
                }
            }
            catch (e) {
                /* istanbul ignore next */
                this.logger.error('Failed to choose null device after stream ended.');
            }
            if (kind === 'audio') {
                this.forEachObserver((observer) => {
                    Types_1.Maybe.of(observer.audioInputStreamEnded).map(f => f.bind(observer)(deviceId));
                });
            }
            else {
                this.forEachObserver((observer) => {
                    Types_1.Maybe.of(observer.videoInputStreamEnded).map(f => f.bind(observer)(deviceId));
                });
            }
        });
    }
    forEachObserver(observerFunc) {
        for (const observer of this.deviceChangeObservers) {
            AsyncScheduler_1.default.nextTick(() => {
                /* istanbul ignore else */
                if (this.deviceChangeObservers.has(observer)) {
                    observerFunc(observer);
                }
            });
        }
    }
    forEachMediaStreamBrokerObserver(observerFunc) {
        for (const observer of this.mediaStreamBrokerObservers) {
            observerFunc(observer);
        }
    }
    areDeviceListsEqual(a, b) {
        return (JSON.stringify(a.map(device => JSON.stringify(device)).sort()) ===
            JSON.stringify(b.map(device => JSON.stringify(device)).sort()));
    }
    intrinsicDeviceAsMediaStream(device) {
        // @ts-ignore
        return device && device.id ? device : null;
    }
    hasSameMediaStreamId(kind, selection, proposedConstraints) {
        var _a, _b, _c, _d;
        // Checking for stream using the fake constraint created in getMediaStreamConstraints
        let streamId;
        if (kind === 'audio') {
            // @ts-ignore
            streamId = proposedConstraints === null || proposedConstraints === void 0 ? void 0 : proposedConstraints.audio.streamId;
            /* istanbul ignore next */
            // @ts-ignore
            return !!streamId && streamId === ((_b = (_a = selection.constraints) === null || _a === void 0 ? void 0 : _a.audio) === null || _b === void 0 ? void 0 : _b.streamId);
        }
        /* istanbul ignore next */
        // @ts-ignore
        streamId = proposedConstraints === null || proposedConstraints === void 0 ? void 0 : proposedConstraints.video.streamId;
        /* istanbul ignore next */
        // @ts-ignore
        return !!streamId && streamId === ((_d = (_c = selection === null || selection === void 0 ? void 0 : selection.constraints) === null || _c === void 0 ? void 0 : _c.video) === null || _d === void 0 ? void 0 : _d.streamId);
    }
    hasSameGroupId(groupId, kind, device) {
        if (groupId === '') {
            return true;
        }
        const deviceIds = DefaultDeviceController.getIntrinsicDeviceId(device);
        this.logger.debug(`Checking deviceIds ${deviceIds} of type ${typeof deviceIds} with groupId ${groupId}`);
        if (typeof deviceIds === 'string' && groupId === this.getGroupIdFromDeviceId(kind, deviceIds)) {
            return true;
        }
        return false;
    }
    getGroupIdFromDeviceId(kind, deviceId) {
        if (this.deviceInfoCache !== null) {
            const cachedDeviceInfo = this.listCachedDevicesOfKind(`${kind}input`).find((cachedDevice) => cachedDevice.deviceId === deviceId);
            if (cachedDeviceInfo && cachedDeviceInfo.groupId) {
                this.logger.debug(`GroupId of deviceId ${deviceId} found in cache is ${cachedDeviceInfo.groupId}`);
                return cachedDeviceInfo.groupId;
            }
        }
        this.logger.debug(`GroupId of deviceId ${deviceId} found in cache is empty`);
        return '';
    }
    handleGetUserMediaError(error, errorTimeMs) {
        if (!error) {
            throw new GetUserMediaError_1.default(error);
        }
        switch (error.name) {
            case 'NotReadableError':
            case 'TrackStartError':
                throw new NotReadableError_1.default(error);
            case 'NotFoundError':
            case 'DevicesNotFoundError':
                throw new NotFoundError_1.default(error);
            case 'NotAllowedError':
            case 'PermissionDeniedError':
            case 'SecurityError':
                if (errorTimeMs &&
                    errorTimeMs < DefaultDeviceController.permissionDeniedOriginDetectionThresholdMs) {
                    throw new PermissionDeniedError_1.default(error, 'Permission denied by browser');
                }
                else {
                    throw new PermissionDeniedError_1.default(error, 'Permission denied by user');
                }
            case 'OverconstrainedError':
            case 'ConstraintNotSatisfiedError':
                throw new OverconstrainedError_1.default(error);
            case 'TypeError':
                throw new TypeError_1.default(error);
            case 'AbortError':
            default:
                throw new GetUserMediaError_1.default(error);
        }
    }
    /**
     * Check whether a device is already selected.
     *
     * @param kind typically 'audio' or 'video'.
     * @param device the device about to be selected.
     * @param selection the existing device selection of this kind.
     * @param proposedConstraints the constraints that will be used when this device is selected.
     * @returns whether `device` matches `selection` ??? that is, whether this device is already selected.
     */
    matchesDeviceSelection(kind, device, selection, proposedConstraints) {
        if (selection &&
            selection.stream.active &&
            (this.hasSameMediaStreamId(kind, selection, proposedConstraints) ||
                (selection.groupId !== null && this.hasSameGroupId(selection.groupId, kind, device)))) {
            // TODO: this should be computed within this function.
            this.logger.debug(`Compare current device constraint ${JSON.stringify(selection.constraints)} to proposed constraints ${JSON.stringify(proposedConstraints)}`);
            return selection.matchesConstraints(proposedConstraints);
        }
        return false;
    }
    chooseInputIntrinsicDevice(kind, device) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            // N.B.,: the input device might already have augmented constraints supplied
            // by an `AudioTransformDevice`. `getMediaStreamConstraints` will respect
            // settings supplied by the device.
            const proposedConstraints = this.getMediaStreamConstraints(kind, device);
            // TODO: `matchesConstraints` should really return compatible/incompatible/exact --
            // `applyConstraints` can be used to reuse the active device while changing the
            // requested constraints.
            if (this.matchesDeviceSelection(kind, device, this.activeDevices[kind], proposedConstraints)) {
                this.logger.info(`reusing existing ${kind} input device`);
                return;
            }
            if (this.activeDevices[kind] && this.activeDevices[kind].stream) {
                this.stopTracksAndRemoveCallbacks(kind);
            }
            const startTimeMs = Date.now();
            const newDevice = new DeviceSelection_1.default();
            try {
                this.logger.info(`requesting new ${kind} device with constraint ${JSON.stringify(proposedConstraints)}`);
                const stream = this.intrinsicDeviceAsMediaStream(device);
                if (kind === 'audio' && device === null) {
                    newDevice.stream = DefaultDeviceController.createEmptyAudioDevice();
                    newDevice.constraints = null;
                }
                else if (stream) {
                    this.logger.info(`using media stream ${stream.id} for ${kind} device`);
                    newDevice.stream = stream;
                    newDevice.constraints = proposedConstraints;
                }
                else {
                    newDevice.stream = yield navigator.mediaDevices.getUserMedia(proposedConstraints);
                    newDevice.constraints = proposedConstraints;
                }
                yield this.handleNewInputDevice(kind, newDevice);
            }
            catch (error) {
                const errorMessage = this.getErrorMessage(error);
                if (kind === 'audio') {
                    (_a = this.eventController) === null || _a === void 0 ? void 0 : _a.publishEvent('audioInputFailed', {
                        audioInputErrorMessage: errorMessage,
                    });
                }
                else {
                    (_b = this.eventController) === null || _b === void 0 ? void 0 : _b.publishEvent('videoInputFailed', {
                        videoInputErrorMessage: errorMessage,
                    });
                }
                this.logger.error(`failed to get ${kind} device for constraints ${JSON.stringify(proposedConstraints)}: ${errorMessage}`);
                let hasError = true;
                // This is effectively `error instanceof OverconstrainedError` but works in Node.
                if (error && 'constraint' in error) {
                    this.logger.error(`Over-constrained by constraint: ${error.constraint}`);
                    // Try to reduce the constraints if over-constraints
                    if (this.useMediaConstraintsFallback) {
                        const fallbackConstraints = this.getMediaStreamConstraints(kind, device, true);
                        const fallbackConstraintsJSON = JSON.stringify(fallbackConstraints);
                        if (fallbackConstraintsJSON !== JSON.stringify(proposedConstraints)) {
                            this.logger.info(`retry requesting new ${kind} device with minimal constraint ${fallbackConstraintsJSON}`);
                            try {
                                newDevice.stream = yield navigator.mediaDevices.getUserMedia(fallbackConstraints);
                                newDevice.constraints = fallbackConstraints;
                                yield this.handleNewInputDevice(kind, newDevice);
                                hasError = false;
                            }
                            catch (e) {
                                this.logger.error(`failed to get ${kind} device for constraints ${fallbackConstraintsJSON}: ${this.getErrorMessage(e)}`);
                            }
                        }
                    }
                }
                if (hasError) {
                    /*
                     * If there is any error while acquiring the audio device, we fall back to null device.
                     * Reason: If device selection fails (e.g. NotReadableError), the peer connection is left hanging
                     * with no active audio track since we release the previously attached track.
                     * If no audio packet has yet been sent to the server, the server will not emit the joined event.
                     */
                    if (kind === 'audio') {
                        this.logger.info(`choosing null ${kind} device instead`);
                        try {
                            newDevice.stream = DefaultDeviceController.createEmptyAudioDevice();
                            newDevice.constraints = null;
                            yield this.handleNewInputDevice(kind, newDevice);
                        }
                        catch (error) {
                            this.logger.error(`failed to choose null ${kind} device. ${error.name}: ${error.message}`);
                        }
                    }
                    this.handleGetUserMediaError(error, Date.now() - startTimeMs);
                }
            }
            finally {
                this.watchForDeviceChangesIfNecessary();
            }
        });
    }
    getErrorMessage(error) {
        if (!error) {
            return 'UnknownError';
        }
        if (error.name && error.message) {
            return `${error.name}: ${error.message}`;
        }
        if (error.name) {
            return error.name;
        }
        if (error.message) {
            return error.message;
        }
        return 'UnknownError';
    }
    handleNewInputDevice(kind, newDevice) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`got ${kind} device for constraints ${JSON.stringify(newDevice.constraints)}`);
            const newDeviceId = (_a = this.getMediaTrackSettings(newDevice.stream)) === null || _a === void 0 ? void 0 : _a.deviceId;
            newDevice.groupId = newDeviceId ? this.getGroupIdFromDeviceId(kind, newDeviceId) : '';
            this.activeDevices[kind] = newDevice;
            this.logger.debug(`Set activeDevice to ${JSON.stringify(newDevice)}`);
            this.watchForDeviceChangesIfNecessary();
            // Add event listener to detect ended event of media track
            // We only monitor the first track, and use its device ID for observer notifications.
            const track = newDevice.stream.getTracks()[0];
            if (track) {
                newDevice.endedCallback = () => {
                    // Hard to test, but the safety check is worthwhile.
                    /* istanbul ignore else */
                    if (this.activeDevices[kind] && this.activeDevices[kind].stream === newDevice.stream) {
                        this.handleDeviceStreamEnded(kind, newDeviceId);
                        delete newDevice.endedCallback;
                    }
                };
                track.addEventListener('ended', newDevice.endedCallback, { once: true });
            }
            // Add event listener to mute/unmute event for audio
            if (kind === 'audio') {
                // We only monitor the first track, and use its device ID for observer notifications.
                const track = newDevice.stream.getAudioTracks()[0];
                if (track) {
                    const id = track.getSettings().deviceId || newDevice.stream;
                    newDevice.trackMuteCallback = () => {
                        this.mediaStreamMuteObserver(id, true);
                    };
                    newDevice.trackUnmuteCallback = () => {
                        this.mediaStreamMuteObserver(id, false);
                    };
                    track.addEventListener('mute', newDevice.trackMuteCallback, { once: false });
                    track.addEventListener('unmute', newDevice.trackUnmuteCallback, { once: false });
                    this.logger.debug('Notifying mute state after selection');
                    if (track.muted) {
                        newDevice.trackMuteCallback();
                    }
                    else {
                        newDevice.trackUnmuteCallback();
                    }
                }
            }
        });
    }
    calculateMediaStreamConstraints(kind, deviceId, groupId, minimal) {
        // No need for any constraints if we want minimal constraint and there is only one device
        if (minimal && this.listCachedDevicesOfKind(`${kind}input`).length === 1) {
            return true;
        }
        const trackConstraints = {};
        // In Samsung Internet browser, navigator.mediaDevices.enumerateDevices()
        // returns same deviceId but different groupdId for some audioinput and videoinput devices.
        // To handle this, we select appropriate device using deviceId + groupId.
        if (this.browserBehavior.requiresNoExactMediaStreamConstraints()) {
            trackConstraints.deviceId = deviceId;
        }
        else {
            trackConstraints.deviceId = { exact: deviceId };
        }
        if (groupId) {
            trackConstraints.groupId = groupId;
        }
        if (minimal) {
            return trackConstraints;
        }
        // Video additional constraints
        if (kind === 'video') {
            trackConstraints.width = {
                ideal: this.videoInputQualitySettings.videoWidth,
            };
            trackConstraints.height = {
                ideal: this.videoInputQualitySettings.videoHeight,
            };
            trackConstraints.frameRate = {
                ideal: this.videoInputQualitySettings.videoFrameRate,
            };
            return trackConstraints;
        }
        // Audio additional constraints
        if (this.supportSampleRateConstraint()) {
            trackConstraints.sampleRate = { ideal: DefaultDeviceController.defaultSampleRate };
        }
        if (this.supportSampleSizeConstraint()) {
            trackConstraints.sampleSize = { ideal: DefaultDeviceController.defaultSampleSize };
        }
        if (this.supportChannelCountConstraint()) {
            trackConstraints.channelCount = { ideal: DefaultDeviceController.defaultChannelCount };
        }
        const augmented = Object.assign({ echoCancellation: true, googEchoCancellation: true, googEchoCancellation2: true, googAutoGainControl: true, googAutoGainControl2: true, googNoiseSuppression: true, googNoiseSuppression2: true, googHighpassFilter: true }, trackConstraints);
        return augmented;
    }
    getMediaStreamConstraintsFromTrackConstraints(kind, trackConstraints) {
        return kind === 'audio' ? { audio: trackConstraints } : { video: trackConstraints };
    }
    getMediaStreamConstraints(kind, device, minimal = false) {
        let trackConstraints = {};
        if (!device) {
            return null;
        }
        const stream = this.intrinsicDeviceAsMediaStream(device);
        if (stream) {
            // @ts-ignore - create a fake track constraint using the stream id
            trackConstraints.streamId = stream.id;
            return this.getMediaStreamConstraintsFromTrackConstraints(kind, trackConstraints);
        }
        if (typeof device === 'string') {
            let groupId = '';
            if (this.browserBehavior.requiresGroupIdMediaStreamConstraints()) {
                if (this.deviceInfoCache !== null) {
                    groupId = this.getGroupIdFromDeviceId(kind, device);
                }
                else {
                    this.logger.error('Device cache is not populated. Please make sure to call list devices first');
                }
            }
            trackConstraints = this.calculateMediaStreamConstraints(kind, device, groupId, minimal);
            return this.getMediaStreamConstraintsFromTrackConstraints(kind, trackConstraints);
        }
        if (isMediaDeviceInfo(device)) {
            trackConstraints = this.calculateMediaStreamConstraints(kind, device.deviceId, device.groupId, minimal);
            return this.getMediaStreamConstraintsFromTrackConstraints(kind, trackConstraints);
        }
        // Take the input set of constraints.
        // In this case, we just use the constraints as-is.
        // @ts-ignore - device is a MediaTrackConstraints
        trackConstraints = device;
        return this.getMediaStreamConstraintsFromTrackConstraints(kind, trackConstraints);
    }
    deviceInfoFromDeviceId(deviceKind, deviceId) {
        if (this.deviceInfoCache === null) {
            return null;
        }
        for (const device of this.deviceInfoCache) {
            if (device.kind === deviceKind && device.deviceId === deviceId) {
                return device;
            }
        }
        return null;
    }
    hasAppliedTransform() {
        return !!this.transform;
    }
    isMediaStreamReusableByDeviceId(stream, device) {
        // for null device, assume the stream is not reusable
        if (!stream || !stream.active || !device) {
            return false;
        }
        if (device.id) {
            return stream.id === device.id;
        }
        const settings = this.getMediaTrackSettings(stream);
        // If a device does not specify deviceId, we have to assume the stream is not reusable.
        if (!settings.deviceId) {
            return false;
        }
        const deviceIds = DefaultDeviceController.getIntrinsicDeviceId(device);
        if (typeof deviceIds === 'string') {
            return settings.deviceId === deviceIds;
        }
        return false;
    }
    getMediaTrackSettings(stream) {
        var _a;
        return (_a = stream.getTracks()[0]) === null || _a === void 0 ? void 0 : _a.getSettings();
    }
    reconnectAudioInputs() {
        if (!this.audioInputSourceNode) {
            return;
        }
        this.audioInputSourceNode.disconnect();
        const output = this.getMediaStreamOutputNode();
        this.audioInputSourceNode.connect(output);
    }
    setTransform(device, nodes) {
        var _a, _b;
        (_b = (_a = this.transform) === null || _a === void 0 ? void 0 : _a.nodes) === null || _b === void 0 ? void 0 : _b.end.disconnect();
        this.transform = { nodes, device };
        const proc = nodes === null || nodes === void 0 ? void 0 : nodes.end;
        const dest = this.getMediaStreamDestinationNode();
        this.logger.debug(`Connecting transform node ${proc} to destination ${dest}.`);
        proc === null || proc === void 0 ? void 0 : proc.connect(dest);
        this.reconnectAudioInputs();
    }
    removeTransform() {
        var _a;
        const previous = this.transform;
        if (!previous) {
            return undefined;
        }
        (_a = this.transform.nodes) === null || _a === void 0 ? void 0 : _a.end.disconnect();
        this.transform = undefined;
        this.reconnectAudioInputs();
        return previous;
    }
    attachAudioInputStreamToAudioContext(stream) {
        var _a;
        (_a = this.audioInputSourceNode) === null || _a === void 0 ? void 0 : _a.disconnect();
        this.audioInputSourceNode = DefaultDeviceController.getAudioContext().createMediaStreamSource(stream);
        const output = this.getMediaStreamOutputNode();
        this.audioInputSourceNode.connect(output);
    }
    /**
     * Return the end of the Web Audio graph: post-transform audio.
     */
    getMediaStreamDestinationNode() {
        if (!this.audioInputDestinationNode) {
            this.audioInputDestinationNode = DefaultDeviceController.getAudioContext().createMediaStreamDestination();
        }
        return this.audioInputDestinationNode;
    }
    /**
     * Return the start of the Web Audio graph: pre-transform audio.
     * If there's no transform node, this is the destination node.
     */
    getMediaStreamOutputNode() {
        var _a, _b;
        return ((_b = (_a = this.transform) === null || _a === void 0 ? void 0 : _a.nodes) === null || _b === void 0 ? void 0 : _b.start) || this.getMediaStreamDestinationNode();
    }
    static getAudioContext() {
        if (!DefaultDeviceController.audioContext) {
            const options = {};
            if (navigator.mediaDevices.getSupportedConstraints().sampleRate) {
                options.sampleRate = DefaultDeviceController.defaultSampleRate;
            }
            // @ts-ignore
            DefaultDeviceController.audioContext = new (window.AudioContext || window.webkitAudioContext)(options);
        }
        return DefaultDeviceController.audioContext;
    }
    static closeAudioContext() {
        if (DefaultDeviceController.audioContext) {
            try {
                DefaultDeviceController.audioContext.close();
            }
            catch (e) {
                // Nothing we can do.
            }
        }
        DefaultDeviceController.audioContext = null;
    }
    addMediaStreamBrokerObserver(observer) {
        this.mediaStreamBrokerObservers.add(observer);
    }
    removeMediaStreamBrokerObserver(observer) {
        this.mediaStreamBrokerObservers.delete(observer);
    }
    publishVideoInputDidChangeEvent(videoStream) {
        this.forEachMediaStreamBrokerObserver((observer) => {
            if (observer.videoInputDidChange) {
                observer.videoInputDidChange(videoStream);
            }
        });
        this.pushVideoMeetingStateForPermissions(videoStream);
    }
    publishAudioInputDidChangeEvent(audioStream) {
        this.forEachMediaStreamBrokerObserver((observer) => {
            if (observer.audioInputDidChange) {
                observer.audioInputDidChange(audioStream);
            }
        });
        this.pushAudioMeetingStateForPermissions(audioStream);
    }
    publishAudioOutputDidChangeEvent(device) {
        this.forEachMediaStreamBrokerObserver((observer) => {
            if (observer.audioOutputDidChange) {
                observer.audioOutputDidChange(device);
            }
        });
    }
    supportSampleRateConstraint() {
        return this.useWebAudio && !!navigator.mediaDevices.getSupportedConstraints().sampleRate;
    }
    supportSampleSizeConstraint() {
        return this.useWebAudio && !!navigator.mediaDevices.getSupportedConstraints().sampleSize;
    }
    supportChannelCountConstraint() {
        return this.useWebAudio && !!navigator.mediaDevices.getSupportedConstraints().channelCount;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trace(name, input, output) {
        let s = `API/DefaultDeviceController/${name}`;
        if (typeof input !== 'undefined') {
            s += ` ${JSON.stringify(input)}`;
        }
        if (typeof output !== 'undefined') {
            s += ` -> ${JSON.stringify(output)}`;
        }
        this.logger.info(s);
    }
}
exports.default = DefaultDeviceController;
DefaultDeviceController.permissionDeniedOriginDetectionThresholdMs = 500;
DefaultDeviceController.defaultVideoWidth = 960;
DefaultDeviceController.defaultVideoHeight = 540;
DefaultDeviceController.defaultVideoFrameRate = 15;
DefaultDeviceController.defaultSampleRate = 48000;
DefaultDeviceController.defaultSampleSize = 16;
DefaultDeviceController.defaultChannelCount = 1;
DefaultDeviceController.audioContext = null;
function isMediaDeviceInfo(device) {
    return (typeof device === 'object' &&
        'deviceId' in device &&
        'groupId' in device &&
        'kind' in device &&
        'label' in device);
}
//# sourceMappingURL=DefaultDeviceController.js.map