"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
const DefaultModality_1 = require("../modality/DefaultModality");
const VideoTileState_1 = require("./VideoTileState");
class DefaultVideoTile {
    constructor(tileId, localTile, tileController, devicePixelRatioMonitor) {
        this.tileController = tileController;
        this.devicePixelRatioMonitor = devicePixelRatioMonitor;
        this.tileState = new VideoTileState_1.default();
        this.tileState.tileId = tileId;
        this.tileState.localTile = localTile;
        this.devicePixelRatioMonitor.registerObserver(this);
    }
    /**
     * Connect a video stream to a video element by setting the srcObject of the video element to the video stream.
     * @param videoStream The video stream input.
     * @param videoElement The video element input.
     * @param localTile Flag to indicate whether this is a local video.
     */
    static connectVideoStreamToVideoElement(videoStream, videoElement, localTile) {
        const transform = localTile && videoStream.getVideoTracks()[0].getSettings().facingMode !== 'environment'
            ? 'rotateY(180deg)'
            : '';
        DefaultVideoTile.setVideoElementFlag(videoElement, 'disablePictureInPicture', localTile);
        DefaultVideoTile.setVideoElementFlag(videoElement, 'disableRemotePlayback', localTile);
        if (videoElement.style.transform !== transform) {
            videoElement.style.transform = transform;
        }
        if (videoElement.hasAttribute('controls')) {
            videoElement.removeAttribute('controls');
        }
        if (!videoElement.hasAttribute('autoplay')) {
            videoElement.setAttribute('autoplay', 'true');
        }
        // playsinline is needed for video to play in iPhone in non-fullscreen mode.
        // See https://developer.apple.com/documentation/webkit/safari_tools_and_features/delivering_video_content_for_safari#3030250
        if (!videoElement.hasAttribute('playsinline')) {
            videoElement.setAttribute('playsinline', 'true');
        }
        // Note that setting the *attribute* 'muted' affects whether the element
        // is muted *by default* (`.defaultMuted`), not whether it is currently muted (`.muted`).
        // https://html.spec.whatwg.org/#dom-media-defaultmuted
        if (!videoElement.hasAttribute('muted')) {
            // The default value…
            videoElement.setAttribute('muted', 'true');
            // … and the value right now.
            videoElement.muted = true;
        }
        if (videoElement.srcObject !== videoStream) {
            videoElement.srcObject = videoStream;
        }
    }
    /**
     * Disconnect a video stream from a video element by setting `HTMLVideoElement.srcObject` to `null`.
     * @param videoElement The video element input.
     * @param dueToPause A flag to indicate whether this function is called due to pausing video tile.
     * Based on `keepLastFrameWhenPaused`, it sets `HTMLVideoElement.srcObject` to `null`.
     * @param keepLastFrameWhenPaused If `true` and `dueToPause` is also `true`, then we will not set `HTMLVideoElement.srcObject` of the
     * video element to `null` when it is paused and therefore, the last frame of the stream will be shown.
     */
    static disconnectVideoStreamFromVideoElement(videoElement, dueToPause, keepLastFrameWhenPaused = false) {
        if (!videoElement) {
            return;
        }
        if (dueToPause) {
            if (!keepLastFrameWhenPaused) {
                videoElement.srcObject = null;
                videoElement.style.transform = '';
            }
        }
        else {
            if (!videoElement.srcObject) {
                return;
            }
            videoElement.pause();
            videoElement.style.transform = '';
            DefaultVideoTile.setVideoElementFlag(videoElement, 'disablePictureInPicture', false);
            DefaultVideoTile.setVideoElementFlag(videoElement, 'disableRemotePlayback', false);
            videoElement.srcObject = null;
        }
    }
    destroy() {
        this.devicePixelRatioMonitor.removeObserver(this);
        if (this.tileState.boundVideoElement &&
            this.tileState.boundVideoElement.srcObject === this.tileState.boundVideoStream) {
            DefaultVideoTile.disconnectVideoStreamFromVideoElement(this.tileState.boundVideoElement, false);
        }
        this.tileState = new VideoTileState_1.default();
    }
    devicePixelRatioChanged(newDevicePixelRatio) {
        this.tileState.devicePixelRatio = newDevicePixelRatio;
        this.sendTileStateUpdate();
    }
    id() {
        return this.tileState.tileId;
    }
    state() {
        return this.tileState.clone();
    }
    stateRef() {
        return this.tileState;
    }
    bindVideoStream(attendeeId, localTile, mediaStream, contentWidth, contentHeight, streamId, externalUserId) {
        let tileUpdated = false;
        if (this.tileState.boundAttendeeId !== attendeeId) {
            this.tileState.boundAttendeeId = attendeeId;
            if (new DefaultModality_1.default(attendeeId).hasModality(DefaultModality_1.default.MODALITY_CONTENT)) {
                this.tileState.isContent = true;
            }
            tileUpdated = true;
        }
        if (this.tileState.boundExternalUserId !== externalUserId) {
            this.tileState.boundExternalUserId = externalUserId;
            tileUpdated = true;
        }
        if (this.tileState.localTile !== localTile) {
            this.tileState.localTile = localTile;
            tileUpdated = true;
        }
        if (this.tileState.boundVideoStream !== mediaStream) {
            this.tileState.boundVideoStream = mediaStream;
            tileUpdated = true;
        }
        if (this.tileState.videoStreamContentWidth !== contentWidth) {
            this.tileState.videoStreamContentWidth = contentWidth;
            tileUpdated = true;
        }
        if (this.tileState.videoStreamContentHeight !== contentHeight) {
            this.tileState.videoStreamContentHeight = contentHeight;
            tileUpdated = true;
        }
        if (this.tileState.streamId !== streamId) {
            this.tileState.streamId = streamId;
            tileUpdated = true;
        }
        if (tileUpdated) {
            this.sendTileStateUpdate();
        }
    }
    bindVideoElement(videoElement) {
        let tileUpdated = false;
        if (this.tileState.boundVideoElement !== videoElement) {
            this.tileState.boundVideoElement = videoElement;
            tileUpdated = true;
        }
        if (this.tileState.boundVideoElement !== null) {
            if (this.tileState.videoElementCSSWidthPixels !== videoElement.clientWidth) {
                this.tileState.videoElementCSSWidthPixels = videoElement.clientWidth;
                tileUpdated = true;
            }
            if (this.tileState.videoElementCSSHeightPixels !== videoElement.clientHeight) {
                this.tileState.videoElementCSSHeightPixels = videoElement.clientHeight;
                tileUpdated = true;
            }
        }
        else {
            this.tileState.videoElementCSSWidthPixels = null;
            this.tileState.videoElementCSSHeightPixels = null;
        }
        if (tileUpdated) {
            this.sendTileStateUpdate();
        }
    }
    pause() {
        if (!this.tileState.paused) {
            this.tileState.paused = true;
            this.sendTileStateUpdate();
        }
    }
    unpause() {
        if (this.tileState.paused) {
            this.tileState.paused = false;
            this.sendTileStateUpdate();
        }
    }
    markPoorConnection() {
        if (this.tileState.poorConnection) {
            return false;
        }
        this.tileState.poorConnection = true;
        this.sendTileStateUpdate();
        return true;
    }
    unmarkPoorConnection() {
        if (!this.tileState.poorConnection) {
            return false;
        }
        this.tileState.poorConnection = false;
        this.sendTileStateUpdate();
        return true;
    }
    capture() {
        if (!this.tileState.active) {
            return null;
        }
        const canvas = document.createElement('canvas');
        const video = this.tileState.boundVideoElement;
        canvas.width = video.videoWidth || video.width;
        canvas.height = video.videoHeight || video.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
    setStreamId(id) {
        this.tileState.streamId = id;
        // `streamId` is not likely used by builders but we can't
        // be sure so send a tile state update just in case.
        this.tileController.sendTileStateUpdate(this.state());
    }
    sendTileStateUpdate() {
        this.updateActiveState();
        this.updateVideoStreamOnVideoElement();
        this.updateVideoElementPhysicalPixels();
        this.tileController.sendTileStateUpdate(this.state());
    }
    updateActiveState() {
        this.tileState.active = !!(!this.tileState.paused &&
            !this.tileState.poorConnection &&
            this.tileState.boundAttendeeId &&
            this.tileState.boundVideoElement &&
            this.tileState.boundVideoStream);
    }
    updateVideoElementPhysicalPixels() {
        if (typeof this.tileState.videoElementCSSWidthPixels === 'number' &&
            typeof this.tileState.videoElementCSSHeightPixels === 'number') {
            this.tileState.videoElementPhysicalWidthPixels =
                this.tileState.devicePixelRatio * this.tileState.videoElementCSSWidthPixels;
            this.tileState.videoElementPhysicalHeightPixels =
                this.tileState.devicePixelRatio * this.tileState.videoElementCSSHeightPixels;
        }
        else {
            this.tileState.videoElementPhysicalWidthPixels = null;
            this.tileState.videoElementPhysicalHeightPixels = null;
        }
    }
    updateVideoStreamOnVideoElement() {
        if (this.tileState.active) {
            DefaultVideoTile.connectVideoStreamToVideoElement(this.tileState.boundVideoStream, this.tileState.boundVideoElement, this.tileState.localTile);
        }
        else {
            DefaultVideoTile.disconnectVideoStreamFromVideoElement(this.tileState.boundVideoElement, this.tileState.paused, this.tileController.keepLastFrameWhenPaused);
        }
    }
    static setVideoElementFlag(videoElement, flag, value) {
        if (flag in videoElement) {
            // @ts-ignore
            videoElement[flag] = value;
        }
    }
}
exports.default = DefaultVideoTile;
//# sourceMappingURL=DefaultVideoTile.js.map