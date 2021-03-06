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
exports.BackgroundFilterMonitor = void 0;
const loader_1 = require("../../libs/voicefocus/loader");
const CanvasVideoFrameBuffer_1 = require("../videoframeprocessor/CanvasVideoFrameBuffer");
const BackgroundFilterFrameCounter_1 = require("./BackgroundFilterFrameCounter");
/** @internal */
class DeferredObservable {
    constructor() {
        /** Access the last-resolved value of next()
         */
        this.value = undefined;
        this.resolve = null;
    }
    /** Create a promise that resolves once next() is called
     */
    whenNext() {
        /* istanbul ignore else */
        if (!this.promise) {
            // externally-resolvable promise
            this.promise = new Promise(resolve => (this.resolve = resolve));
        }
        return this.promise;
    }
    /** Update the value and resolve
     */
    next(value) {
        // store the value, for sync access
        this.value = value;
        // resolve the promise so anyone awaiting whenNext resolves
        this.resolve(value);
        // delete the promise so future whenNext calls get a new promise
        delete this.promise;
    }
}
/**
 * The [[BackgroundFilterProcessor]] uses WASM and TensorFlow Lite to apply changes to the
 * background image.
 */
/** @internal */
class BackgroundFilterProcessor {
    constructor(filterType, spec, options, delegate) {
        this.targetCanvas = document.createElement('canvas');
        this.canvasCtx = this.targetCanvas.getContext('2d');
        this.canvasVideoFrameBuffer = new CanvasVideoFrameBuffer_1.default(this.targetCanvas);
        this.mask$ = new DeferredObservable();
        this.sourceWidth = 0;
        this.sourceHeight = 0;
        this.frameNumber = 0;
        this.videoFramesPerFilterUpdate = 1;
        this.initWorkerPromise = BackgroundFilterProcessor.createWorkerPromise();
        this.loadModelPromise = BackgroundFilterProcessor.createWorkerPromise();
        this.modelInitialized = false;
        this.destroyed = false;
        this.filterType = filterType;
        this.validateSpec(spec);
        this.validateOptions(options);
        this.spec = spec;
        this.logger = options.logger;
        this.delegate = delegate;
        this.initCPUMonitor(options);
    }
    static createWorkerPromise() {
        const resolver = { resolve: null, reject: null, promise: null };
        resolver.promise = new Promise((resolve, reject) => {
            resolver.resolve = resolve;
            resolver.reject = reject;
        });
        return resolver;
    }
    /** Check if the input spec are not null
     */
    validateSpec(spec) {
        if (!spec) {
            throw new Error('processor has null spec');
        }
        if (!spec.model) {
            throw new Error('processor spec has null model');
        }
        if (!spec.paths) {
            throw new Error('processor spec has null paths');
        }
    }
    validateOptions(options) {
        if (!options) {
            throw new Error('processor has null options');
        }
        if (!options.logger) {
            throw new Error('processor has null options - logger');
        }
        if (!options.reportingPeriodMillis) {
            throw new Error('processor has null options - reportingPeriodMillis');
        }
        if (!options.filterCPUUtilization) {
            throw new Error('processor has null options - filterCPUUtilization');
        }
    }
    initCPUMonitor(options) {
        const CPU_MONITORING_PERIOD_MILLIS = 5000;
        const MAX_SEGMENTATION_SKIP_RATE = 10;
        const MIN_SEGMENTATION_SKIP_RATE = 1;
        this.videoFramesPerFilterUpdate = 1;
        this.frameCounter = new BackgroundFilterFrameCounter_1.default(this.delegate, options.reportingPeriodMillis, options.filterCPUUtilization, this.logger);
        this.cpuMonitor = new BackgroundFilterMonitor(CPU_MONITORING_PERIOD_MILLIS, {
            reduceCPUUtilization: () => {
                this.updateVideoFramesPerFilterUpdate(Math.min(this.videoFramesPerFilterUpdate + 1, MAX_SEGMENTATION_SKIP_RATE));
            },
            increaseCPUUtilization: () => {
                this.updateVideoFramesPerFilterUpdate(Math.max(this.videoFramesPerFilterUpdate - 1, MIN_SEGMENTATION_SKIP_RATE));
            },
        });
        this.delegate.addObserver(this.cpuMonitor);
    }
    /** Converts a value to a JSON string
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stringify(value) {
        return JSON.stringify(value, null, 2);
    }
    /**
     * Sends a message to worker and resolves promise in response to worker's initialize event
     */
    handleInitialize(msg) {
        this.logger.info(`received initialize message: ${this.stringify(msg)}`);
        if (!msg.payload) {
            this.logger.error('failed to initialize module');
            this.initWorkerPromise.reject(new Error('failed to initialize the module'));
            return;
        }
        const model = this.spec.model;
        this.worker.postMessage({
            msg: 'loadModel',
            payload: {
                modelUrl: model.path,
                inputHeight: model.input.height,
                inputWidth: model.input.width,
                inputChannels: 4,
                modelRangeMin: model.input.range[0],
                modelRangeMax: model.input.range[1],
                blurPixels: 0,
            },
        });
        this.initWorkerPromise.resolve({});
    }
    /**
     * Resolves promise in response to worker's loadModel event
     */
    handleLoadModel(msg) {
        this.logger.info(`received load model message: ${this.stringify(msg)}`);
        if (msg.payload !== 2) {
            this.logger.error('failed to load model! status: ' + msg.payload);
            /** Rejects model promise
             */
            this.loadModelPromise.reject(new Error('failed to load model! status: ' + msg.payload));
            return;
        }
        this.modelInitialized = true;
        this.loadModelPromise.resolve({});
    }
    /** Updates the payload output value in response to worker's predict event
     */
    handlePredict(msg) {
        this.mask$.next(msg.payload.output);
    }
    /**
     * This method will handle the asynchronous messaging between the main JS thread
     * and the worker thread.
     * @param evt An event that was sent from the worker to the JS thread.
     * @returns
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleWorkerEvent(evt) {
        const msg = evt.data;
        switch (msg.msg) {
            case 'initialize':
                this.handleInitialize(msg);
                break;
            case 'loadModel':
                this.handleLoadModel(msg);
                break;
            case 'predict':
                this.handlePredict(msg);
                break;
            default:
                this.logger.info(`unexpected event msg: ${this.stringify(msg)}`);
                break;
        }
    }
    /**
     * This method initializes all of the resource necessary to processs background filter. It returns
     * a promise and resolves or rejects the promise once the initialization is complete.
     * @returns
     * @throws An error will be thrown
     */
    loadAssets() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('start initializing the processor');
            try {
                this.worker = yield loader_1.loadWorker(this.spec.paths.worker, 'BackgroundFilterWorker', {}, null);
                this.worker.addEventListener('message', ev => this.handleWorkerEvent(ev));
                this.worker.postMessage({
                    msg: 'initialize',
                    payload: {
                        wasmPath: this.spec.paths.wasm,
                        simdPath: this.spec.paths.simd,
                    },
                });
                yield this.initWorkerPromise.promise;
                this.logger.info(`successfully initialized the ${this.filterType} worker`);
                yield this.loadModelPromise.promise;
                this.logger.info(`successfully loaded ${this.filterType} worker segmentation model`);
            }
            catch (error) {
                throw new Error(`could not initialize the ${this.filterType} video frame processor due to '${error.message}'`);
            }
            this.logger.info(`successfully initialized the ${this.filterType} processor`);
        });
    }
    /**
     * Processes the VideoFrameBuffer by applying a segmentation mask and replacing the background.
     * @param buffers object that contains the canvas element that will be used to obtain the image data to process
     * @returns the updated buffer that contains the image with the background replaced.
     */
    process(buffers) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.destroyed) {
                return buffers;
            }
            this.frameCounter.frameReceived(buffers[0].framerate);
            this.cpuMonitor.frameReceived();
            const inputCanvas = buffers[0].asCanvasElement();
            if (!inputCanvas) {
                return buffers;
            }
            if (!this.modelInitialized) {
                // return existing buffer, if any
                buffers[0] = this.canvasVideoFrameBuffer;
                return buffers;
            }
            const frameWidth = inputCanvas.width;
            const frameHeight = inputCanvas.height;
            if (frameWidth === 0 || frameHeight === 0) {
                return buffers;
            }
            // on first execution of process the source width will be zero
            if (this.sourceWidth === 0) {
                this.sourceWidth = frameWidth;
                this.sourceHeight = frameHeight;
                // update target canvas size to match the frame size
                this.targetCanvas.width = this.sourceWidth;
                this.targetCanvas.height = this.sourceHeight;
                this.logger.info(`${this.filterType} source width: ${this.sourceWidth}`);
                this.logger.info(`${this.filterType} source height: ${this.sourceHeight}`);
                this.initOnFirstExecution();
            }
            if (this.sourceWidth !== frameWidth || this.sourceHeight !== frameHeight) {
                this.sourceWidth = frameWidth;
                this.sourceHeight = frameHeight;
                // update target canvas size to match the frame size
                this.targetCanvas.width = this.sourceWidth;
                this.targetCanvas.height = this.sourceHeight;
            }
            try {
                this.frameCounter.filterSubmitted();
                let mask = this.mask$.value;
                const hscale = this.spec.model.input.width / inputCanvas.width;
                const vscale = this.spec.model.input.height / inputCanvas.height;
                if (this.scaledCanvas === undefined) {
                    this.scaledCanvas = document.createElement('canvas');
                    this.scaledCanvas.width = this.spec.model.input.width;
                    this.scaledCanvas.height = this.spec.model.input.height;
                }
                const scaledCtx = this.scaledCanvas.getContext('2d');
                scaledCtx.save();
                scaledCtx.scale(hscale, vscale);
                scaledCtx.drawImage(inputCanvas, 0, 0);
                scaledCtx.restore();
                const imageData = scaledCtx.getImageData(0, 0, this.scaledCanvas.width, this.scaledCanvas.height);
                // update the filter mask based on the filter update rate
                if (this.frameNumber % this.videoFramesPerFilterUpdate === 0) {
                    // process frame...
                    const maskPromise = this.mask$.whenNext();
                    this.worker.postMessage({ msg: 'predict', payload: imageData }, [imageData.data.buffer]);
                    mask = yield maskPromise;
                }
                // It's possible that while waiting for the predict to complete the processor was destroyed.
                // adding a destroyed check here to ensure the implementation of drawImageWithMask does not throw
                // an error due to destroyed processor.
                if (!this.destroyed) {
                    this.drawImageWithMask(inputCanvas, mask);
                }
            }
            catch (error) {
                this.logger.error(`could not process ${this.filterType} frame buffer due to ${error}`);
                return buffers;
            }
            finally {
                this.frameCounter.filterComplete();
                this.frameNumber++;
            }
            buffers[0] = this.canvasVideoFrameBuffer;
            return buffers;
        });
    }
    updateVideoFramesPerFilterUpdate(newRate) {
        if (newRate !== this.videoFramesPerFilterUpdate) {
            this.videoFramesPerFilterUpdate = newRate;
            this.logger.info(`Adjusting filter rate to compensate for CPU utilization. ` +
                `Filter rate is ${this.videoFramesPerFilterUpdate} video frames per filter.`);
        }
    }
    /**
     * Clean up processor resources
     */
    destroy() {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            this.destroyed = true;
            this.delegate.removeObserver(this.cpuMonitor);
            this.canvasVideoFrameBuffer.destroy();
            (_a = this.worker) === null || _a === void 0 ? void 0 : _a.postMessage({ msg: 'destroy' });
            (_b = this.worker) === null || _b === void 0 ? void 0 : _b.postMessage({ msg: 'stop' });
            (_c = this.targetCanvas) === null || _c === void 0 ? void 0 : _c.remove();
            this.targetCanvas = undefined;
            (_d = this.scaledCanvas) === null || _d === void 0 ? void 0 : _d.remove();
            this.scaledCanvas = undefined;
            this.logger.info(`${this.filterType} frame process destroyed`);
        });
    }
}
exports.default = BackgroundFilterProcessor;
/** @internal */
class BackgroundFilterMonitor {
    constructor(monitoringPeriodMillis, observer) {
        this.monitoringPeriodMillis = monitoringPeriodMillis;
        this.observer = observer;
        this.lastCPUChangeTimestamp = 0;
    }
    filterCPUUtilizationHigh() {
        const timestamp = Date.now();
        // Allow some time to pass before we check CPU utilization.
        if (timestamp - this.lastCPUChangeTimestamp >= this.monitoringPeriodMillis) {
            this.lastCPUChangeTimestamp = timestamp;
            this.observer.reduceCPUUtilization();
        }
    }
    frameReceived() {
        const timestamp = Date.now();
        // If a enough time has passed, reset the processor and continue to monitor
        if (timestamp - this.lastCPUChangeTimestamp >= this.monitoringPeriodMillis * 2) {
            this.lastCPUChangeTimestamp = timestamp;
            this.observer.increaseCPUUtilization();
        }
    }
}
exports.BackgroundFilterMonitor = BackgroundFilterMonitor;
//# sourceMappingURL=BackgroundFilterProcessor.js.map