"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingSessionStatusCode = void 0;
var MeetingSessionStatusCode;
(function (MeetingSessionStatusCode) {
    /**
     * Everything is OK so far.
     */
    MeetingSessionStatusCode[MeetingSessionStatusCode["OK"] = 0] = "OK";
    /**
     * The attendee left the meeting normally.
     */
    MeetingSessionStatusCode[MeetingSessionStatusCode["Left"] = 1] = "Left";
    /**
     * The attendee joined from another device.
     */
    MeetingSessionStatusCode[MeetingSessionStatusCode["AudioJoinedFromAnotherDevice"] = 2] = "AudioJoinedFromAnotherDevice";
    /**
     * Authentication was rejected. The client is not allowed on this meeting.
     */
    MeetingSessionStatusCode[MeetingSessionStatusCode["AudioAuthenticationRejected"] = 3] = "AudioAuthenticationRejected";
    /**
     * The client can not join because the meeting is at capacity.
     */
    MeetingSessionStatusCode[MeetingSessionStatusCode["AudioCallAtCapacity"] = 4] = "AudioCallAtCapacity";
    /**
     * The attendee attempted to join a meeting that has already ended.
     */
    MeetingSessionStatusCode[MeetingSessionStatusCode["MeetingEnded"] = 5] = "MeetingEnded";
    /**
     * There was an internal server error with the audio leg.
     */
    MeetingSessionStatusCode[MeetingSessionStatusCode["AudioInternalServerError"] = 6] = "AudioInternalServerError";
    /**
     * Could not connect the audio leg due to the service being unavailable.
     */
    MeetingSessionStatusCode[MeetingSessionStatusCode["AudioServiceUnavailable"] = 7] = "AudioServiceUnavailable";
    /**
     * The audio leg failed.
     */
    MeetingSessionStatusCode[MeetingSessionStatusCode["AudioDisconnected"] = 8] = "AudioDisconnected";
    /**
     * The client has asked to send and receive video, but it is only possible to
     * continue in view-only mode (receiving video). This should be handled by
     * explicitly switching to view-only mode.
     */
    MeetingSessionStatusCode[MeetingSessionStatusCode["VideoCallSwitchToViewOnly"] = 9] = "VideoCallSwitchToViewOnly";
    /**
     * This can happen when you attempt to join a video meeting in "send only" mode
     * (transmitting your camera, but not receiving anything -- this isn't something
     * we ever do in practice, but it is supported on the server). It should be
     * treated as "fatal" and probably should not be retried (despite the 5xx nature).
     */
    MeetingSessionStatusCode[MeetingSessionStatusCode["VideoCallAtSourceCapacity"] = 10] = "VideoCallAtSourceCapacity";
    /**
     * The Chime SDK for JavaScript failed to establish a signaling connection because
     * you or someone else deleted the attendee using the DeleteAttendee API action
     * in your server application. You also should not use the attendee response from
     * the ended meeting that you created with the same ClientRequestToken parameter
     * before.
     * https://docs.aws.amazon.com/chime/latest/APIReference/API_DeleteAttendee.html
     */
    MeetingSessionStatusCode[MeetingSessionStatusCode["SignalingBadRequest"] = 11] = "SignalingBadRequest";
    /**
     * The Chime SDK for JavaScript failed to establish a signaling connection to the Chime
     * backend due to an internal server error.
     */
    MeetingSessionStatusCode[MeetingSessionStatusCode["SignalingInternalServerError"] = 12] = "SignalingInternalServerError";
    /**
     * Received unknown signaling error frame
     */
    MeetingSessionStatusCode[MeetingSessionStatusCode["SignalingRequestFailed"] = 13] = "SignalingRequestFailed";
    /**
     * Timed out gathering ICE candidates. If in Chrome, this could be an
     * indication that the browser is in a bad state due to a VPN reconnect and
     * the user should try quitting and relaunching the app. See:
     * https://bugs.chromium.org/p/webrtc/issues/detail?id=9097
     */
    MeetingSessionStatusCode[MeetingSessionStatusCode["ICEGatheringTimeoutWorkaround"] = 14] = "ICEGatheringTimeoutWorkaround";
    /**
     * Due to connection health, a reconnect has been triggered.
     */
    MeetingSessionStatusCode[MeetingSessionStatusCode["ConnectionHealthReconnect"] = 15] = "ConnectionHealthReconnect";
    /**
     * The realtime API failed in some way. This indicates a fatal problem.
     */
    MeetingSessionStatusCode[MeetingSessionStatusCode["RealtimeApiFailed"] = 16] = "RealtimeApiFailed";
    /**
     * A task failed for an unknown reason.
     */
    MeetingSessionStatusCode[MeetingSessionStatusCode["TaskFailed"] = 17] = "TaskFailed";
    /**
     * Session update produces incompatible SDP.
     */
    MeetingSessionStatusCode[MeetingSessionStatusCode["IncompatibleSDP"] = 18] = "IncompatibleSDP";
    /**
     * This can happen when you attempt to join a meeting which has ended or attendee got removed
     */
    MeetingSessionStatusCode[MeetingSessionStatusCode["TURNCredentialsForbidden"] = 19] = "TURNCredentialsForbidden";
    /**
     * The attendee is not present.
     */
    MeetingSessionStatusCode[MeetingSessionStatusCode["NoAttendeePresent"] = 20] = "NoAttendeePresent";
    /**
     * The meeting was ended because the attendee has been removed.
     */
    MeetingSessionStatusCode[MeetingSessionStatusCode["AudioAttendeeRemoved"] = 21] = "AudioAttendeeRemoved";
    /**
     * The attendees Primary meeting credentials have been revoked or deleted.
     */
    MeetingSessionStatusCode[MeetingSessionStatusCode["AudioVideoWasRemovedFromPrimaryMeeting"] = 22] = "AudioVideoWasRemovedFromPrimaryMeeting";
})(MeetingSessionStatusCode = exports.MeetingSessionStatusCode || (exports.MeetingSessionStatusCode = {}));
exports.default = MeetingSessionStatusCode;
//# sourceMappingURL=MeetingSessionStatusCode.js.map