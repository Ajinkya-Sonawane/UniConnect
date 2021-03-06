"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
const DefaultTransceiverController_1 = require("./DefaultTransceiverController");
class VideoOnlyTransceiverController extends DefaultTransceiverController_1.default {
    constructor(logger, browserBehavior) {
        super(logger, browserBehavior);
    }
    setupLocalTransceivers() {
        if (!this.useTransceivers()) {
            return;
        }
        if (!this.defaultMediaStream && typeof MediaStream !== 'undefined') {
            this.defaultMediaStream = new MediaStream();
        }
        if (!this._localCameraTransceiver) {
            this._localCameraTransceiver = this.peer.addTransceiver('video', {
                direction: 'inactive',
                streams: [this.defaultMediaStream],
            });
        }
    }
}
exports.default = VideoOnlyTransceiverController;
//# sourceMappingURL=VideoOnlyTransceiverController.js.map