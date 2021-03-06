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
const BackgroundFilterProcessor_1 = require("../backgroundfilter/BackgroundFilterProcessor");
const BackgroundReplacementVideoFrameProcessorDelegate_1 = require("./BackgroundReplacementVideoFrameProcessorDelegate");
/**
 * [[BackgroundReplacementFilter]] implements [[BackgroundReplacementProcessor]].
 * It's a background replacement processor and input is passed into a worker that will apply a segmentation
 * to separate the foreground from the background. Then the background will have a replacement applied.
 *
 * The [[BackgroundReplacementProcessorProvided]] uses WASM and TensorFlow Lite to apply replacement of the
 * background image.
 */
/** @internal */
class BackgroundReplacementFilter extends BackgroundFilterProcessor_1.default {
    /**
     * A constructor that will apply default values if spec and strength are not provided.
     * If no spec is provided the selfie segmentation model is used with default paths to CDN for the
     * worker and wasm files used to process each frame.
     * @param spec The spec defines the assets that will be used for adding background filter to a frame
     * @param options The background replacement image path
     */
    constructor(spec, options) {
        super('background replacement', spec, options, new BackgroundReplacementVideoFrameProcessorDelegate_1.default());
        this.replacementBlob = options.imageBlob;
        this.logger.info('BackgroundReplacement processor successfully created');
        this.logger.info(`BackgroundReplacement spec: ${this.stringify(this.spec)}`);
        this.logger.info(`BackgroundReplacement options: ${this.stringify(options)}`);
    }
    setImageBlob(blob) {
        return __awaiter(this, void 0, void 0, function* () {
            this.replacementBlob = blob;
            this.replacementImage = yield BackgroundReplacementFilter.loadImage(this.createReplacementObjectUrl());
        });
    }
    initOnFirstExecution() { }
    drawImageWithMask(inputCanvas, mask) {
        // Mask will not be set until the worker has completed handling the predict event. Until the first frame is processed,
        // the whole frame will be replaced.
        if (!mask) {
            mask = new ImageData(this.spec.model.input.width, this.spec.model.input.height);
        }
        const scaledCtx = this.scaledCanvas.getContext('2d');
        scaledCtx.putImageData(mask, 0, 0);
        const { canvasCtx, targetCanvas } = this;
        const { width, height } = targetCanvas;
        // draw the mask
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, width, height);
        canvasCtx.drawImage(this.scaledCanvas, 0, 0, width, height);
        // Only overwrite existing pixels.
        canvasCtx.globalCompositeOperation = 'source-in';
        // draw image over mask...
        canvasCtx.drawImage(inputCanvas, 0, 0, width, height);
        // draw under person
        canvasCtx.globalCompositeOperation = 'destination-over';
        canvasCtx.drawImage(this.replacementImage, 0, 0, targetCanvas.width, targetCanvas.height);
        canvasCtx.restore();
    }
    /* istanbul ignore next */
    static loadImageExecutor(resolve, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reject, imageUrl) {
        const image = new Image();
        image.crossOrigin = 'Anonymous';
        image.addEventListener('load', () => {
            resolve(image);
        }, false);
        image.addEventListener('error', error => {
            reject(new Error(`Could not load replacement image ${image.src}: ${error.message}`));
        }, false);
        image.src = imageUrl;
    }
    /** @internal */
    static loadImage(imageUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => this.loadImageExecutor(resolve, reject, imageUrl));
        });
    }
    revokeReplacementObjectUrl() {
        if (this.replacementObjectUrl) {
            URL.revokeObjectURL(this.replacementObjectUrl);
        }
    }
    createReplacementObjectUrl() {
        this.revokeReplacementObjectUrl();
        this.replacementObjectUrl = URL.createObjectURL(this.replacementBlob);
        return this.replacementObjectUrl;
    }
    /**
     * This method initializes all of the resource necessary to process background replacement. It returns
     * a promise and resolves or rejects the promise once the initialization is complete.
     * @returns
     * @throws An error will be thrown
     */
    loadAssets() {
        const _super = Object.create(null, {
            loadAssets: { get: () => super.loadAssets }
        });
        return __awaiter(this, void 0, void 0, function* () {
            this.replacementImage = yield BackgroundReplacementFilter.loadImage(this.createReplacementObjectUrl());
            _super.loadAssets.call(this);
            return;
        });
    }
    addObserver(observer) {
        this.delegate.addObserver(observer);
    }
    removeObserver(observer) {
        this.delegate.removeObserver(observer);
    }
    destroy() {
        const _super = Object.create(null, {
            destroy: { get: () => super.destroy }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.destroy.call(this);
            this.revokeReplacementObjectUrl();
        });
    }
}
exports.default = BackgroundReplacementFilter;
//# sourceMappingURL=BackgroundReplacementFilter.js.map