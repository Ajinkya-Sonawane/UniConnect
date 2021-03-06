"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.TargetDisplaySize = void 0;
/**
 * [[TargetDisplaySize]] represents the max resolution that a video stream can have when simulcast is enabled in priority based downlink policy.
 * If there is only one stream being sent, then this field will get ignored.  Its values currently parallel [[SimulcastLayers]].
 */
var TargetDisplaySize;
(function (TargetDisplaySize) {
    /**
     * Low resolution video stream.
     */
    TargetDisplaySize[TargetDisplaySize["Low"] = 0] = "Low";
    /**
     * Medium resolution video stream.
     */
    TargetDisplaySize[TargetDisplaySize["Medium"] = 1] = "Medium";
    /**
     * High resolution video stream.
     */
    TargetDisplaySize[TargetDisplaySize["High"] = 2] = "High";
})(TargetDisplaySize = exports.TargetDisplaySize || (exports.TargetDisplaySize = {}));
exports.default = TargetDisplaySize;
//# sourceMappingURL=TargetDisplaySize.js.map