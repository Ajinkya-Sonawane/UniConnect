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
const loader_1 = require("../../libs/voicefocus/loader");
const support_1 = require("../../libs/voicefocus/support");
const ModelSpecBuilder_1 = require("../backgroundblurprocessor/ModelSpecBuilder");
const DefaultBrowserBehavior_1 = require("../browserbehavior/DefaultBrowserBehavior");
const Versioning_1 = require("../versioning/Versioning");
/** @internal */
const CREATE_DEFAULT_MODEL_SPEC = () => ModelSpecBuilder_1.default.builder().withSelfieSegmentationDefaults().build();
/** @internal */
const DEFAULT_CDN = 'https://static.sdkassets.chime.aws';
/** @internal */
const DEFAULT_PATHS = {
    worker: `${DEFAULT_CDN}/bgblur/workers/worker.js`,
    wasm: `${DEFAULT_CDN}/bgblur/wasm/_cwt-wasm.wasm`,
    simd: `${DEFAULT_CDN}/bgblur/wasm/_cwt-wasm-simd.wasm`,
};
class BackgroundFilterVideoFrameProcessor {
    /**
     * Based on the SDK version, return an asset group.
     *
     * @returns the default asset spec, based on the SDK version.
     */
    static defaultAssetSpec() {
        const version = Versioning_1.default.sdkVersionSemVer;
        return {
            assetGroup: `sdk-${version.major}.${version.minor}`,
        };
    }
    /**
     * Set the given parameters to the url. Existing parameters in the url are preserved.
     * If duplicate parameters exist, they are overwritten, so it's safe to call this method multiple
     * times on the same url.
     *
     * @param url the initial url, can include query parameters
     * @param queryParams the query parameters to set
     * @returns a new url with the given query parameters.
     */
    static createUrlWithParams(url, queryParams) {
        const u = new URL(url);
        const keys = Object.keys(queryParams);
        for (const key of keys) {
            if (queryParams[key] !== undefined) {
                u.searchParams.set(key, queryParams[key]);
            }
        }
        return u.toString();
    }
    /**
     * Based on the spec that is passed in set defaults for spec
     * @param spec the spec that was passed in
     * @returns An updated spec with defaults set
     */
    static resolveSpec(spec) {
        const { paths = DEFAULT_PATHS, model = CREATE_DEFAULT_MODEL_SPEC(), assetGroup = this.defaultAssetSpec().assetGroup, revisionID = this.defaultAssetSpec().revisionID, } = spec || {};
        const params = {
            assetGroup,
            revisionID,
            sdk: encodeURIComponent(Versioning_1.default.sdkVersion),
            ua: encodeURIComponent(Versioning_1.default.sdkUserAgentLowResolution),
        };
        paths.worker = this.createUrlWithParams(paths.worker, params);
        paths.wasm = this.createUrlWithParams(paths.wasm, params);
        paths.simd = this.createUrlWithParams(paths.simd, params);
        model.path = this.createUrlWithParams(model.path, params);
        return {
            paths,
            model,
            assetGroup,
            revisionID,
        };
    }
    /**
     * Based on the options that are passed in set defaults for options
     * @param options  the options that are passed in
     * @returns An updated set of options with defaults set
     */
    static resolveOptions(options) {
        if (!options.reportingPeriodMillis) {
            options.reportingPeriodMillis = 1000;
        }
        const DEFAULT_FILTER_CPU_UTILIZATION = 30;
        if (!options.filterCPUUtilization) {
            options.filterCPUUtilization = DEFAULT_FILTER_CPU_UTILIZATION;
        }
        else if (options.filterCPUUtilization < 0 || options.filterCPUUtilization > 100) {
            options.logger.warn(`filterCPUUtilization must be set to a range between 0 and 100 percent. Falling back to default of ${DEFAULT_FILTER_CPU_UTILIZATION} percent`);
            options.filterCPUUtilization = DEFAULT_FILTER_CPU_UTILIZATION;
        }
        return options;
    }
    /**
     * This method will detect the environment in which it is being used and determine if background
     * blur/replacement can be used.
     * @param spec The {@link BackgroundBlurSpec} spec that will be used to initialize assets
     * @param options options such as logger
     * @returns a boolean promise that will resolve to true if supported and false if not
     */
    static isSupported(spec, options) {
        const { logger } = options;
        // could not figure out how to remove globalThis to test failure case
        /* istanbul ignore next */
        if (typeof globalThis === 'undefined') {
            logger.info('Browser does not have globalThis.');
            return Promise.resolve(false);
        }
        const browser = new DefaultBrowserBehavior_1.default();
        if (!browser.supportsBackgroundFilter()) {
            logger.info('Browser is not supported.');
            return Promise.resolve(false);
        }
        if (!support_1.supportsWASM(globalThis, logger)) {
            logger.info('Browser does not support WASM.');
            return Promise.resolve(false);
        }
        return this.supportsBackgroundFilter(globalThis, spec, logger);
    }
    static supportsBackgroundFilter(
    /* istanbul ignore next */
    scope = globalThis, spec, logger) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!support_1.supportsWorker(scope, logger)) {
                logger.info('Browser does not support web workers.');
                return false;
            }
            // Use the actual worker path -- it's only 20KB, and it'll get the cache warm.
            const workerURL = spec.paths.worker;
            try {
                const worker = yield loader_1.loadWorker(workerURL, 'BackgroundFilterWorker', {}, null);
                try {
                    worker.terminate();
                }
                catch (e) {
                    logger.info(`Failed to terminate worker. ${e.message}`);
                }
                return true;
            }
            catch (e) {
                logger.info(`Failed to fetch and instantiate test worker ${e.message}`);
                return false;
            }
        });
    }
}
exports.default = BackgroundFilterVideoFrameProcessor;
//# sourceMappingURL=BackgroundFilterVideoFrameProcessor.js.map