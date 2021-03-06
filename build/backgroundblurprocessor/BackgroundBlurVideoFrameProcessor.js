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
const BackgroundFilterVideoFrameProcessor_1 = require("../backgroundfilter/BackgroundFilterVideoFrameProcessor");
const ConsoleLogger_1 = require("../logger/ConsoleLogger");
const LogLevel_1 = require("../logger/LogLevel");
const NoOpVideoFrameProcessor_1 = require("../videoframeprocessor/NoOpVideoFrameProcessor");
const BackgroundBlurProcessorBuiltIn_1 = require("./BackgroundBlurProcessorBuiltIn");
const BackgroundBlurProcessorProvided_1 = require("./BackgroundBlurProcessorProvided");
const BackgroundBlurStrength_1 = require("./BackgroundBlurStrength");
/**
 * No-op implementation of the blur processor. An instance of this class will be returned when a user attempts
 * to create a blur processor when it is not supported.
 */
/** @internal */
class NoOpBackgroundBlurProcessor extends NoOpVideoFrameProcessor_1.default {
    /**
     * no-op
     */
    setBlurStrength() { }
    /**
     * no-op
     * @returns
     */
    loadAssets() {
        return __awaiter(this, void 0, void 0, function* () {
            return;
        });
    }
    /**
     * no-op
     */
    addObserver() { }
    /**
     * no-op
     */
    removeObserver() { }
}
/**
 * [[BackgroundBlurVideoFrameProcessor]]
 * Creates a background blur processor which identifies the foreground person and blurs the background.
 */
class BackgroundBlurVideoFrameProcessor extends BackgroundFilterVideoFrameProcessor_1.default {
    /**
     * A factory method that will call the private constructor to instantiate the processor and asynchronously
     * initialize the worker, wasm, and ML models. Upon completion of the initialization the promise will either
     * be resolved or rejected.
     * @param spec The spec defines the assets that will be used for adding background blur to a frame
     * @param blurStrength How much blur to apply to a frame
     * @returns
     */
    static create(spec, options) {
        return __awaiter(this, void 0, void 0, function* () {
            spec = BackgroundBlurVideoFrameProcessor.resolveSpec(spec);
            options = BackgroundBlurVideoFrameProcessor.resolveOptions(options);
            const { logger } = options;
            const supported = yield BackgroundBlurVideoFrameProcessor.isSupported(spec, options);
            // if blur is not supported do not initialize. The processor will become a no op if not supported.
            logger.info(`processor is ${supported ? '' : 'not'} supported`);
            if (!supported) {
                logger.warn('Using no-op processor because background blur is not supported');
                return new NoOpBackgroundBlurProcessor();
            }
            let processor;
            if (yield BackgroundBlurProcessorProvided_1.default.isSupported()) {
                logger.info('Using browser-provided background blur');
                processor = new BackgroundBlurProcessorProvided_1.default(spec, options);
            }
            else {
                logger.info('Using built-in background blur');
                processor = new BackgroundBlurProcessorBuiltIn_1.default(spec, options);
            }
            yield processor.loadAssets();
            return processor;
        });
    }
    /**
     * Based on the options that are passed in set defaults for options
     * @param options  the options that are passed in
     * @returns An updated set of options with defaults set
     */
    static resolveOptions(options = {}) {
        let processorOptions = Object.assign({}, options);
        if (!processorOptions.blurStrength) {
            processorOptions.blurStrength = BackgroundBlurStrength_1.default.MEDIUM;
        }
        if (!processorOptions.logger) {
            processorOptions.logger = new ConsoleLogger_1.default('BackgroundBlurProcessor', LogLevel_1.default.INFO);
        }
        processorOptions = super.resolveOptions(processorOptions);
        return processorOptions;
    }
    /**
     * This method will detect the environment in which it is being used and determine if background
     * blur can be used.
     * @param spec The {@link BackgroundBlurSpec} spec that will be used to initialize assets
     * @param options options such as logger
     * @returns a boolean promise that will resolve to true if supported and false if not
     */
    static isSupported(spec, options) {
        spec = BackgroundBlurVideoFrameProcessor.resolveSpec(spec);
        options = BackgroundBlurVideoFrameProcessor.resolveOptions(options);
        return super.isSupported(spec, options);
    }
}
exports.default = BackgroundBlurVideoFrameProcessor;
//# sourceMappingURL=BackgroundBlurVideoFrameProcessor.js.map