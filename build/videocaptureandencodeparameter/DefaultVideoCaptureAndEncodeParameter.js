"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
class DefaultVideoCaptureAndEncodeParameter {
    constructor(cameraWidth, cameraHeight, cameraFrameRate, maxEncodeBitrateKbps, isSimulcast, scaleResolutionDownBy = 1) {
        this.cameraWidth = cameraWidth;
        this.cameraHeight = cameraHeight;
        this.cameraFrameRate = cameraFrameRate;
        this.maxEncodeBitrateKbps = maxEncodeBitrateKbps;
        this.isSimulcast = isSimulcast;
        this.scaleResolutionDownBy = scaleResolutionDownBy;
    }
    equal(other) {
        let checkForEqual = other.captureWidth() === this.cameraWidth &&
            other.captureHeight() === this.cameraHeight &&
            other.captureFrameRate() === this.cameraFrameRate &&
            other.encodeBitrates().length === this.encodeBitrates().length &&
            other.encodeScaleResolutionDownBy().length === this.encodeScaleResolutionDownBy().length &&
            other.encodeWidths().length === this.encodeWidths().length &&
            other.encodeHeights().length === this.encodeHeights().length;
        if (checkForEqual) {
            for (let i = 0; i < other.encodeWidths().length; i++) {
                if (other.encodeWidths()[i] !== this.encodeWidths()[i] ||
                    other.encodeHeights()[i] !== this.encodeHeights()[i] ||
                    other.encodeBitrates()[i] !== this.encodeBitrates()[i] ||
                    other.encodeScaleResolutionDownBy()[i] !== this.encodeScaleResolutionDownBy()[i]) {
                    checkForEqual = false;
                    return checkForEqual;
                }
            }
        }
        return checkForEqual;
    }
    clone() {
        return new DefaultVideoCaptureAndEncodeParameter(this.cameraWidth, this.cameraHeight, this.cameraFrameRate, this.maxEncodeBitrateKbps, this.isSimulcast, this.scaleResolutionDownBy);
    }
    captureWidth() {
        return this.cameraWidth;
    }
    captureHeight() {
        return this.cameraHeight;
    }
    captureFrameRate() {
        return this.cameraFrameRate;
    }
    encodeBitrates() {
        // TODO: add simulcast layer
        return [this.maxEncodeBitrateKbps];
    }
    encodeScaleResolutionDownBy() {
        return [this.scaleResolutionDownBy];
    }
    encodeWidths() {
        return [this.cameraWidth];
    }
    encodeHeights() {
        return [this.cameraHeight];
    }
}
exports.default = DefaultVideoCaptureAndEncodeParameter;
//# sourceMappingURL=DefaultVideoCaptureAndEncodeParameter.js.map