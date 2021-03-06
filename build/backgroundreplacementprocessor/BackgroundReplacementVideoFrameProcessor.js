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
const BackgroundReplacementFilter_1 = require("./BackgroundReplacementFilter");
/**
 * No-op implementation of the background replacement processor. An instance of this class will be returned when a user attempts
 * to create a background replacement processor when it is not supported.
 */
/** @internal */
class NoOpBackgroundReplacementProcessor extends NoOpVideoFrameProcessor_1.default {
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
    /**
     * no-op
     */
    setImageBlob() {
        return __awaiter(this, void 0, void 0, function* () {
            return;
        });
    }
}
/**
 * [[BackgroundReplacementVideoFrameProcessor]]
 * Creates a background replacement processor which identifies the foreground person and replaces the background.
 */
class BackgroundReplacementVideoFrameProcessor extends BackgroundFilterVideoFrameProcessor_1.default {
    /**
     * A factory method that will call the private constructor to instantiate the processor and asynchronously
     * initialize the worker, wasm, and ML models. Upon completion of the initialization the promise will either
     * be resolved or rejected.
     * @param spec The spec defines the assets that will be used for adding background filter to a frame
     * @param imagePath The background replacement image path
     */
    static create(spec, options) {
        return __awaiter(this, void 0, void 0, function* () {
            spec = this.resolveSpec(spec);
            options = this.resolveOptions(options);
            yield this.resolveOptionsAsync(options);
            const { logger } = options;
            const supported = yield BackgroundReplacementVideoFrameProcessor.isSupported(spec, options);
            // if background replacement is not supported do not initialize. The processor will become a no op if not supported.
            if (!supported) {
                logger.warn('Using no-op processor because background replacement is not supported');
                return new NoOpBackgroundReplacementProcessor();
            }
            logger.info('Using background replacement filter');
            const processor = new BackgroundReplacementFilter_1.default(spec, options);
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
        const processorOptions = Object.assign({}, options);
        if (!processorOptions.logger) {
            processorOptions.logger = new ConsoleLogger_1.default('BackgroundReplacementProcessor', LogLevel_1.default.INFO);
        }
        return super.resolveOptions(processorOptions);
    }
    static resolveOptionsAsync(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!options.imageBlob) {
                const canvas = document.createElement('canvas');
                canvas.width = 100;
                canvas.height = 100;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'blue';
                ctx.fillRect(0, 0, 100, 100);
                const blob = yield new Promise(resolve => {
                    canvas.toBlob(resolve);
                });
                options.imageBlob = blob;
            }
            return;
        });
    }
    /**
     * This method will detect the environment in which it is being used and determine if background
     * replacement can be used.
     * @param spec The {@link BackgroundFilterSpec} spec that will be used to initialize assets
     * @param options options such as logger and imagePath
     * @returns a boolean promise that will resolve to true if supported and false if not
     */
    static isSupported(spec, options) {
        const _super = Object.create(null, {
            isSupported: { get: () => super.isSupported }
        });
        return __awaiter(this, void 0, void 0, function* () {
            spec = this.resolveSpec(spec);
            options = this.resolveOptions(options);
            yield this.resolveOptionsAsync(options);
            const imageBlob = options.imageBlob;
            const imageUrl = URL.createObjectURL(imageBlob);
            try {
                yield BackgroundReplacementFilter_1.default.loadImage(imageUrl);
            }
            catch (e) {
                options.logger.info(`Failed to fetch load replacement image ${e.message}`);
                return false;
            }
            finally {
                URL.revokeObjectURL(imageUrl);
            }
            return _super.isSupported.call(this, spec, options);
        });
    }
}
exports.default = BackgroundReplacementVideoFrameProcessor;
//# sourceMappingURL=BackgroundReplacementVideoFrameProcessor.js.map