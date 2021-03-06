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
const __1 = require("..");
const SignalingClientEventType_1 = require("../signalingclient/SignalingClientEventType");
const SignalingProtocol_js_1 = require("../signalingprotocol/SignalingProtocol.js");
const BaseTask_1 = require("./BaseTask");
/**
 * [[PromoteToPrimaryMeetingTask]] sends a `SdkSignalFrame.PrimaryMeetingJoin` and waits for
 * a `SdkSignalFrame.PrimaryMeetingJoinAck`  frame.
 */
class PromoteToPrimaryMeetingTask extends BaseTask_1.default {
    constructor(context, credentials, completionCallback) {
        super(context.logger);
        this.context = context;
        this.credentials = credentials;
        this.completionCallback = completionCallback;
        this.taskName = 'PromoteToPrimaryMeetingTask';
        this.taskCanceler = null;
    }
    cancel() {
        if (this.taskCanceler) {
            this.taskCanceler.cancel();
            this.taskCanceler = null;
        }
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.context.signalingClient.ready()) {
                this.context.signalingClient.promoteToPrimaryMeeting(this.credentials);
                this.context.logger.info('Sent request to join primary meeting');
                yield this.receivePrimaryMeetingJoinAck();
            }
            else {
                this.completionCallback(new __1.MeetingSessionStatus(__1.MeetingSessionStatusCode.SignalingRequestFailed));
            }
        });
    }
    receivePrimaryMeetingJoinAck() {
        return new Promise((resolve, _) => {
            class Interceptor {
                constructor(signalingClient, completionCallback, logger) {
                    this.signalingClient = signalingClient;
                    this.completionCallback = completionCallback;
                    this.logger = logger;
                }
                cancel() {
                    this.signalingClient.removeObserver(this);
                    // Currently only cancel would come from timeout.  Should
                    // be rare enough (ignoring bugs) that we don't need to bother
                    // retrying.
                    this.completionCallback(new __1.MeetingSessionStatus(__1.MeetingSessionStatusCode.SignalingRequestFailed));
                    resolve();
                }
                handleSignalingClientEvent(event) {
                    if (event.isConnectionTerminated()) {
                        this.signalingClient.removeObserver(this);
                        this.logger.info('PromoteToPrimaryMeetingTask connection terminated');
                        // This would happen either in happy or unhappy disconnections.  The
                        // timing here is rare enough (ignoring bugs) that we don't need to bother
                        // retrying the unhappy case.
                        this.completionCallback(new __1.MeetingSessionStatus(__1.MeetingSessionStatusCode.SignalingRequestFailed));
                        resolve();
                    }
                    if (event.type === SignalingClientEventType_1.default.ReceivedSignalFrame &&
                        event.message.type === SignalingProtocol_js_1.SdkSignalFrame.Type.PRIMARY_MEETING_JOIN_ACK) {
                        this.signalingClient.removeObserver(this);
                        this.logger.info('Got a primary meeting join ACK');
                        this.completionCallback(__1.MeetingSessionStatus.fromSignalFrame(event.message));
                        resolve();
                    }
                }
            }
            const interceptor = new Interceptor(this.context.signalingClient, this.completionCallback, this.context.logger);
            this.taskCanceler = interceptor;
            this.context.signalingClient.registerObserver(interceptor);
        });
    }
}
exports.default = PromoteToPrimaryMeetingTask;
//# sourceMappingURL=PromoteToPrimaryMeetingTask.js.map