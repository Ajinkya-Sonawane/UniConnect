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
/**
 * A device that augments a {@link Device} to apply Amazon Voice Focus
 * noise suppression to an audio input.
 */
class VoiceFocusTransformDevice {
    /** @internal */
    constructor(device, voiceFocus, delegate, nodeOptions, failed = false, node = undefined, browserBehavior = new DefaultBrowserBehavior_1.default(), 
    /** farEndStreams` maps from a stream that could cause echo or interfere with double talkto an `AudioSourceNode` that we use to mix multiple such streams.*/
    farEndStreamToAudioSourceNode = new Map(), 
    /** mixDestNode is the Audio Destination Node where farEndStreams got mixed into one stream.*/
    mixDestNode = undefined, 
    /** mixSourceNode is the Audio Source Node where the stream out of mixDestNode got transfered into Audio Worklet Node for processing.*/
    mixSourceNode = undefined) {
        this.device = device;
        this.voiceFocus = voiceFocus;
        this.delegate = delegate;
        this.nodeOptions = nodeOptions;
        this.failed = failed;
        this.node = node;
        this.browserBehavior = browserBehavior;
        this.farEndStreamToAudioSourceNode = farEndStreamToAudioSourceNode;
        this.mixDestNode = mixDestNode;
        this.mixSourceNode = mixSourceNode;
    }
    /**
     * Return the inner device as provided during construction, or updated via
     * {@link VoiceFocusTransformDevice.chooseNewInnerDevice}. Do not confuse
     * this method with {@link VoiceFocusTransformDevice.intrinsicDevice}.
     */
    getInnerDevice() {
        return this.device;
    }
    /**
     * Disable the audio node while muted to reduce CPU usage.
     *
     * @param muted whether the audio device should be muted.
     */
    mute(muted) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.node) {
                return;
            }
            if (muted) {
                yield this.node.disable();
            }
            else {
                yield this.node.enable();
            }
        });
    }
    /**
     * Dispose of the inner workings of the transform device. After this method is called
     * you will need to create a new device to use Amazon Voice Focus again.
     */
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.node) {
                return;
            }
            this.node.disconnect();
            yield this.node.stop();
        });
    }
    /**
     * If you wish to choose a different inner device, but continue to use Amazon Voice Focus, you
     * can use this method to efficiently create a new device that will reuse
     * the same internal state. Only one of the two devices can be used at a time: switch
     * between them using {@link DeviceController.startAudioInput}.
     *
     * If the same device is passed as is currently in use, `this` is returned.
     *
     * @param inner The new inner device to use.
     */
    chooseNewInnerDevice(inner) {
        return __awaiter(this, void 0, void 0, function* () {
            // If the new device is 'default', always recreate. Chrome can switch out
            // the real device underneath us.
            if (this.device === inner && !isDefaultDevice(inner)) {
                return this;
            }
            return new VoiceFocusTransformDevice(inner, this.voiceFocus, this.delegate, this.nodeOptions, this.failed, this.node, this.browserBehavior, this.farEndStreamToAudioSourceNode, this.mixDestNode, this.mixSourceNode);
        });
    }
    intrinsicDevice() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.failed) {
                return this.device;
            }
            const isUsingES = this.nodeOptions.es;
            // Turn the Device into constraints with appropriate AGC settings.
            const trackConstraints = {
                echoCancellation: !isUsingES,
                // @ts-ignore
                googEchoCancellation: !isUsingES,
                // @ts-ignore
                googEchoCancellation2: !isUsingES,
                noiseSuppression: false,
                // @ts-ignore
                googNoiseSuppression: false,
                // @ts-ignore
                googHighpassFilter: false,
                // @ts-ignore
                googNoiseSuppression2: false,
            };
            let useBuiltInAGC;
            if (this.nodeOptions && this.nodeOptions.agc !== undefined) {
                useBuiltInAGC = this.nodeOptions.agc.useBuiltInAGC;
            }
            else {
                useBuiltInAGC = true;
            }
            trackConstraints.autoGainControl = useBuiltInAGC;
            // @ts-ignore
            trackConstraints.googAutoGainControl = useBuiltInAGC;
            // @ts-ignore
            trackConstraints.googAutoGainControl2 = useBuiltInAGC;
            // Empty string and null.
            if (!this.device) {
                return trackConstraints;
            }
            // Device ID.
            if (typeof this.device === 'string') {
                /* istanbul ignore if */
                if (this.browserBehavior.requiresNoExactMediaStreamConstraints()) {
                    trackConstraints.deviceId = this.device;
                }
                else {
                    trackConstraints.deviceId = { exact: this.device };
                }
                return trackConstraints;
            }
            // It's a stream.
            if (this.device.id) {
                // Nothing we can do.
                return this.device;
            }
            // It's constraints.
            return Object.assign(Object.assign({}, this.device), trackConstraints);
        });
    }
    createAudioNode(context) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (((_a = this.node) === null || _a === void 0 ? void 0 : _a.context) === context) {
                return {
                    start: this.node,
                    end: this.node,
                };
            }
            const agc = { useVoiceFocusAGC: false };
            const options = Object.assign({ enabled: true, agc }, this.nodeOptions);
            try {
                (_b = this.node) === null || _b === void 0 ? void 0 : _b.disconnect();
                this.node = yield this.voiceFocus.createNode(context, options);
                if (this.nodeOptions.es) {
                    this.mixDestNode = new MediaStreamAudioDestinationNode(context, {
                        channelCount: 1,
                        channelCountMode: 'explicit',
                    });
                    for (const stream of this.farEndStreamToAudioSourceNode.keys()) {
                        this.assignFarEndStreamToAudioSourceNode(stream);
                    }
                    this.createMixSourceNode();
                }
                const start = this.node;
                const end = this.node;
                return { start, end };
            }
            catch (e) {
                // It's better to return some audio stream than nothing.
                this.failed = true;
                this.delegate.onFallback(this, e);
                throw e;
            }
        });
    }
    observeMeetingAudio(audioVideo) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.nodeOptions.es) {
                return;
            }
            audioVideo.addAudioMixObserver(this);
            const stream = yield audioVideo.getCurrentMeetingAudioStream();
            if (stream) {
                this.addFarEndStream(stream);
            }
        });
    }
    unObserveMeetingAudio(audioVideo) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.nodeOptions.es) {
                return;
            }
            audioVideo.removeAudioMixObserver(this);
            const stream = yield audioVideo.getCurrentMeetingAudioStream();
            if (stream) {
                this.removeFarendStream(stream);
            }
        });
    }
    /**
     * Add an observer to receive notifications about Amazon Voice Focus lifecycle events.
     * See {@link VoiceFocusTransformDeviceObserver} for details.
     * If the observer has already been added, this method call has no effect.
     */
    addObserver(observer) {
        this.delegate.addObserver(observer);
    }
    /**
     * Remove an existing observer. If the observer has not been previously {@link
     * VoiceFocusTransformDevice.addObserver|added}, this method call has no effect.
     */
    removeObserver(observer) {
        this.delegate.removeObserver(observer);
    }
    addFarEndStream(activeStream) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.nodeOptions.es ||
                !activeStream ||
                this.farEndStreamToAudioSourceNode.has(activeStream)) {
                return;
            }
            if (this.node) {
                this.assignFarEndStreamToAudioSourceNode(activeStream);
            }
            else {
                this.farEndStreamToAudioSourceNode.set(activeStream, null);
            }
        });
    }
    removeFarendStream(inactiveStream) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            (_a = this.farEndStreamToAudioSourceNode.get(inactiveStream)) === null || _a === void 0 ? void 0 : _a.disconnect();
            this.farEndStreamToAudioSourceNode.delete(inactiveStream);
        });
    }
    meetingAudioStreamBecameActive(activeStream) {
        return __awaiter(this, void 0, void 0, function* () {
            this.addFarEndStream(activeStream);
        });
    }
    meetingAudioStreamBecameInactive(inactiveStream) {
        return __awaiter(this, void 0, void 0, function* () {
            this.removeFarendStream(inactiveStream);
        });
    }
    assignFarEndStreamToAudioSourceNode(streamToAdd) {
        const streamNodeToAdd = this.node.context.createMediaStreamSource(streamToAdd);
        streamNodeToAdd.channelCount = 1;
        streamNodeToAdd.channelCountMode = 'explicit';
        this.farEndStreamToAudioSourceNode.set(streamToAdd, streamNodeToAdd);
        streamNodeToAdd.connect(this.mixDestNode, 0);
    }
    createMixSourceNode() {
        this.mixSourceNode = this.node.context.createMediaStreamSource(this.mixDestNode.stream);
        this.mixSourceNode.channelCount = 1;
        this.mixSourceNode.channelCountMode = 'explicit';
        this.mixSourceNode.connect(this.node, 0, 1);
    }
}
function isDefaultDevice(device) {
    if (device === 'default') {
        return true;
    }
    if (!device || typeof device !== 'object') {
        return false;
    }
    if ('deviceId' in device && device.deviceId === 'default') {
        return true;
    }
    if ('id' in device && device.id === 'default') {
        return true;
    }
    return false;
}
exports.default = VoiceFocusTransformDevice;
//# sourceMappingURL=VoiceFocusTransformDevice.js.map