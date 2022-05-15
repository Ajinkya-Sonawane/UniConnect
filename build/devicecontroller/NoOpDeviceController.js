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
exports.NoOpDeviceControllerWithEventController = void 0;
const NoOpMediaStreamBroker_1 = require("../mediastreambroker/NoOpMediaStreamBroker");
class NoOpDeviceController extends NoOpMediaStreamBroker_1.default {
    constructor(_options) {
        super();
        this.destroyed = false;
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            this.destroyed = true;
        });
    }
    listAudioInputDevices() {
        return Promise.resolve([]);
    }
    listVideoInputDevices() {
        return Promise.resolve([]);
    }
    listAudioOutputDevices() {
        return Promise.resolve([]);
    }
    startAudioInput(_device) {
        return Promise.reject();
    }
    stopAudioInput() {
        return Promise.resolve();
    }
    startVideoInput(_device) {
        return Promise.reject();
    }
    stopVideoInput() {
        return Promise.resolve();
    }
    chooseAudioOutput(_deviceId) {
        return Promise.reject();
    }
    addDeviceChangeObserver(_observer) { }
    removeDeviceChangeObserver(_observer) { }
    createAnalyserNodeForAudioInput() {
        return null;
    }
    startVideoPreviewForVideoInput(_element) { }
    stopVideoPreviewForVideoInput(_element) { }
    setDeviceLabelTrigger(_trigger) { }
    mixIntoAudioInput(_stream) {
        return null;
    }
    chooseVideoInputQuality(_width, _height, _frameRate) { }
    getVideoInputQualitySettings() {
        return null;
    }
}
exports.default = NoOpDeviceController;
class NoOpDeviceControllerWithEventController extends NoOpDeviceController {
    constructor(eventController) {
        super();
        this.eventController = eventController;
    }
}
exports.NoOpDeviceControllerWithEventController = NoOpDeviceControllerWithEventController;
//# sourceMappingURL=NoOpDeviceController.js.map