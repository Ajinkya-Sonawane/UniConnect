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
const BackgroundBlurStrength_1 = require("./BackgroundBlurStrength");
const BackgroundBlurVideoFrameProcessorDelegate_1 = require("./BackgroundBlurVideoFrameProcessorDelegate");
/**
 * [[BackgroundBlurProcessorProvided]] implements [[BackgroundBlurProcessor]].
 * It's a background blur processor and input is passed into a worker that will apply a segmentation
 * to separate the foreground from the background. Then the background will have a blur applied.
 *
 * The [[BackgroundBlurProcessorProvided]] uses WASM and TensorFlow Lite to apply the blurring of the
 * background image as apposed to [[BackgroundBlurProcessorBuiltIn]] that uses the browser's built-in
 * capability to apply the blur.
 */
/** @internal */
class BackgroundBlurProcessorProvided extends BackgroundFilterProcessor_1.default {
    /**
     * A constructor that will apply default values if spec and strength are not provided.
     * If no spec is provided the selfie segmentation model is used with default paths to CDN for the
     * worker and wasm files used to process each frame.
     * @param spec The spec defines the assets that will be used for adding background blur to a frame
     * @param options How much blur to apply to a frame
     */
    constructor(spec, options) {
        super('background blur', spec, options, new BackgroundBlurVideoFrameProcessorDelegate_1.default());
        this.blurAmount = 0;
        this.setBlurStrength(options.blurStrength);
        this.logger.info('BackgroundBlur processor successfully created');
        this.logger.info(`BackgroundBlur spec: ${this.stringify(this.spec)}`);
        this.logger.info(`BackgroundBlur options: ${this.stringify(options)}`);
    }
    validateOptions(options) {
        super.validateOptions(options);
        if (!options.blurStrength) {
            throw new Error('processor has null options - blurStrength');
        }
    }
    initOnFirstExecution() {
        this.setBlurPixels();
    }
    drawImageWithMask(inputCanvas, mask) {
        // Mask will not be set until the worker has completed handling the predict event. Until the first frame is processed,
        // the whole frame will be blurred.
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
        canvasCtx.filter = `blur(${this.blurAmount}px)`;
        canvasCtx.drawImage(inputCanvas, 0, 0, targetCanvas.width, targetCanvas.height);
        canvasCtx.restore();
    }
    setBlurStrength(blurStrength) {
        this._blurStrength = blurStrength;
        this.logger.info(`blur strength set to ${this._blurStrength}`);
        this.setBlurPixels();
    }
    /**
     * Calculate the blur amount based on the blur strength passed in and height of the image being blurred.
     */
    setBlurPixels() {
        this.blurAmount = BackgroundBlurStrength_1.BlurStrengthMapper.getBlurAmount(this._blurStrength, {
            height: this.sourceHeight,
        });
        this.logger.info(`background blur amount set to ${this.blurAmount}`);
    }
    addObserver(observer) {
        this.delegate.addObserver(observer);
    }
    removeObserver(observer) {
        this.delegate.removeObserver(observer);
    }
    static isSupported() {
        return __awaiter(this, void 0, void 0, function* () {
            const canvas = document.createElement('canvas');
            const supportsBlurFilter = canvas.getContext('2d').filter !== undefined;
            canvas.remove();
            return supportsBlurFilter;
        });
    }
}
exports.default = BackgroundBlurProcessorProvided;
//# sourceMappingURL=BackgroundBlurProcessorProvided.js.map