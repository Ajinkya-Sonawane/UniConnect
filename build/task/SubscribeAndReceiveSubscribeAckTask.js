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
const MeetingSessionStatus_1 = require("../meetingsession/MeetingSessionStatus");
const MeetingSessionStatusCode_1 = require("../meetingsession/MeetingSessionStatusCode");
const SDP_1 = require("../sdp/SDP");
const ZLIBTextCompressor_1 = require("../sdp/ZLIBTextCompressor");
const SignalingClientEventType_1 = require("../signalingclient/SignalingClientEventType");
const SignalingClientSubscribe_1 = require("../signalingclient/SignalingClientSubscribe");
const SignalingProtocol_js_1 = require("../signalingprotocol/SignalingProtocol.js");
const BaseTask_1 = require("./BaseTask");
/**
 * [[SubscribeAndReceiveSubscribeAckTask]] sends a subscribe frame with the given settings
 * and receives SdkSubscribeAckFrame.
 */
class SubscribeAndReceiveSubscribeAckTask extends BaseTask_1.default {
    constructor(context) {
        super(context.logger);
        this.context = context;
        this.taskName = 'SubscribeAndReceiveSubscribeAckTask';
        this.taskCanceler = null;
        this.textCompressor = new ZLIBTextCompressor_1.default(context.logger);
    }
    cancel() {
        if (this.taskCanceler) {
            this.taskCanceler.cancel();
            this.taskCanceler = null;
        }
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            let localSdp = '';
            if (this.context.peer && this.context.peer.localDescription) {
                localSdp = new SDP_1.default(this.context.peer.localDescription.sdp).withUnifiedPlanFormat().sdp;
            }
            if (!this.context.enableSimulcast) {
                // backward compatibility
                let frameRate = 0;
                let maxEncodeBitrateKbps = 0;
                if (this.context.videoCaptureAndEncodeParameter) {
                    frameRate = this.context.videoCaptureAndEncodeParameter.captureFrameRate();
                    maxEncodeBitrateKbps = this.context.videoCaptureAndEncodeParameter.encodeBitrates()[0];
                }
                const param = {
                    rid: 'hi',
                    maxBitrate: maxEncodeBitrateKbps * 1000,
                    maxFramerate: frameRate,
                    active: true,
                };
                this.context.videoStreamIndex.integrateUplinkPolicyDecision([param]);
            }
            this.context.videoStreamIndex.subscribeFrameSent();
            // See comment above `fixUpSubscriptionOrder`
            const videoSubscriptions = this.fixUpSubscriptionOrder(localSdp, this.context.videoSubscriptions);
            const isSendingStreams = this.context.videoDuplexMode === SignalingProtocol_js_1.SdkStreamServiceType.TX ||
                this.context.videoDuplexMode === SignalingProtocol_js_1.SdkStreamServiceType.DUPLEX;
            let compressedSDPOffer;
            const localSdpOffer = localSdp;
            if (this.context.serverSupportsCompression) {
                // If the server supports compression, then send the compressed version of the sdp
                // and exclude the original sdp offer.
                const prevOffer = this.context.previousSdpOffer ? this.context.previousSdpOffer.sdp : '';
                compressedSDPOffer = this.textCompressor.compress(localSdpOffer, prevOffer);
                this.context.logger.info(`Compressed the SDP message from ${localSdpOffer.length} to ${compressedSDPOffer.length} bytes.`);
                localSdp = '';
            }
            this.context.previousSdpOffer = new SDP_1.default(localSdpOffer);
            const subscribe = new SignalingClientSubscribe_1.default(this.context.meetingSessionConfiguration.credentials.attendeeId, localSdp, this.context.meetingSessionConfiguration.urls.audioHostURL, this.context.realtimeController.realtimeIsLocalAudioMuted(), false, videoSubscriptions, isSendingStreams, this.context.videoStreamIndex.localStreamDescriptions(), 
            // TODO: handle check-in mode, or remove this param
            true, compressedSDPOffer);
            this.context.logger.info(`sending subscribe: ${JSON.stringify(subscribe)}`);
            this.context.signalingClient.subscribe(subscribe);
            const subscribeAckFrame = yield this.receiveSubscribeAck();
            this.context.logger.info(`got subscribe ack: ${JSON.stringify(subscribeAckFrame)}`);
            let decompressedText = '';
            if (subscribeAckFrame.compressedSdpAnswer && subscribeAckFrame.compressedSdpAnswer.length) {
                decompressedText = this.textCompressor.decompress(subscribeAckFrame.compressedSdpAnswer, this.context.previousSdpAnswerAsString);
                if (decompressedText.length === 0) {
                    this.context.sdpAnswer = '';
                    this.context.previousSdpAnswerAsString = '';
                    this.logAndThrow(`Error occurred while trying to decompress the SDP answer.`);
                }
                this.context.logger.info(`Decompressed the SDP message from ${subscribeAckFrame.compressedSdpAnswer.length} to ${decompressedText.length} bytes.`);
                this.context.sdpAnswer = decompressedText;
            }
            else {
                this.context.sdpAnswer = subscribeAckFrame.sdpAnswer;
            }
            this.context.previousSdpAnswerAsString = this.context.sdpAnswer;
            this.context.videoStreamIndex.integrateSubscribeAckFrame(subscribeAckFrame);
        });
    }
    // Our backends currently expect the video subscriptions passed in subscribe to precisely
    // line up with the media sections, with a zero for any video send or inactive section.
    //
    // Firefox occasionally tosses stopped transceivers at the end of the SDP without reason
    // and in general we don't want to be at the mercy of SDP sections not being in the same
    // order as `getTransceivers`, so we simply recalculate the array here to enforce that
    // expected invarient until we refactor our signaling to simply take a mapping of MID to
    // subscription.
    //
    // This only works on Unified Plan SDPs
    fixUpSubscriptionOrder(sdp, videoSubscriptions) {
        if (this.context.transceiverController.getMidForStreamId === undefined) {
            return videoSubscriptions;
        }
        const midsToStreamIds = new Map();
        for (const streamId of videoSubscriptions) {
            // The local description will have been set by the time this task is running, so all
            // of the transceivers should have `mid` set by now (see comment above `getMidForStreamId`)
            const mid = this.context.transceiverController.getMidForStreamId(streamId);
            if (mid === undefined) {
                if (streamId !== 0) {
                    // Send section or inactive section
                    this.context.logger.warn(`Could not find MID for stream ID: ${streamId}`);
                }
                continue;
            }
            midsToStreamIds.set(mid, streamId);
        }
        const sections = new SDP_1.default(sdp).mediaSections();
        const newSubscriptions = [];
        for (const section of sections) {
            if (section.mediaType !== 'video') {
                continue;
            }
            if (section.direction === 'recvonly') {
                const streamId = midsToStreamIds.get(section.mid);
                if (streamId === undefined) {
                    this.context.logger.warn(`Could not find stream ID for MID: ${section.mid}`);
                    continue;
                }
                newSubscriptions.push(streamId);
            }
            else {
                newSubscriptions.push(0);
            }
        }
        this.context.logger.info(`Fixed up ${JSON.stringify(videoSubscriptions)} to ${JSON.stringify(newSubscriptions)} (may be same))}`);
        return newSubscriptions;
    }
    receiveSubscribeAck() {
        return new Promise((resolve, reject) => {
            const context = this.context;
            class Interceptor {
                constructor(signalingClient) {
                    this.signalingClient = signalingClient;
                }
                cancel() {
                    this.signalingClient.removeObserver(this);
                    reject(new Error(`SubscribeAndReceiveSubscribeAckTask got canceled while waiting for SdkSubscribeAckFrame`));
                }
                handleSignalingClientEvent(event) {
                    if (event.isConnectionTerminated()) {
                        const message = `SubscribeAndReceiveSubscribeAckTask connection was terminated with code ${event.closeCode} and reason: ${event.closeReason}`;
                        context.logger.warn(message);
                        let statusCode = MeetingSessionStatusCode_1.default.TaskFailed;
                        if (event.closeCode >= 4500 && event.closeCode < 4600) {
                            statusCode = MeetingSessionStatusCode_1.default.SignalingInternalServerError;
                        }
                        context.audioVideoController.handleMeetingSessionStatus(new MeetingSessionStatus_1.default(statusCode), new Error(message));
                        return;
                    }
                    if (event.type !== SignalingClientEventType_1.default.ReceivedSignalFrame ||
                        event.message.type !== SignalingProtocol_js_1.SdkSignalFrame.Type.SUBSCRIBE_ACK) {
                        return;
                    }
                    this.signalingClient.removeObserver(this);
                    // @ts-ignore: force cast to SdkSubscribeAckFrame
                    const subackFrame = event.message.suback;
                    resolve(subackFrame);
                }
            }
            const interceptor = new Interceptor(this.context.signalingClient);
            this.context.signalingClient.registerObserver(interceptor);
            this.taskCanceler = interceptor;
        });
    }
}
exports.default = SubscribeAndReceiveSubscribeAckTask;
//# sourceMappingURL=SubscribeAndReceiveSubscribeAckTask.js.map