export declare enum MeetingSessionStatusCode {
    /**
     * Everything is OK so far.
     */
    OK = 0,
    /**
     * The attendee left the meeting normally.
     */
    Left = 1,
    /**
     * The attendee joined from another device.
     */
    AudioJoinedFromAnotherDevice = 2,
    /**
     * Authentication was rejected. The client is not allowed on this meeting.
     */
    AudioAuthenticationRejected = 3,
    /**
     * The client can not join because the meeting is at capacity.
     */
    AudioCallAtCapacity = 4,
    /**
     * The attendee attempted to join a meeting that has already ended.
     */
    MeetingEnded = 5,
    /**
     * There was an internal server error with the audio leg.
     */
    AudioInternalServerError = 6,
    /**
     * Could not connect the audio leg due to the service being unavailable.
     */
    AudioServiceUnavailable = 7,
    /**
     * The audio leg failed.
     */
    AudioDisconnected = 8,
    /**
     * The client has asked to send and receive video, but it is only possible to
     * continue in view-only mode (receiving video). This should be handled by
     * explicitly switching to view-only mode.
     */
    VideoCallSwitchToViewOnly = 9,
    /**
     * This can happen when you attempt to join a video meeting in "send only" mode
     * (transmitting your camera, but not receiving anything -- this isn't something
     * we ever do in practice, but it is supported on the server). It should be
     * treated as "fatal" and probably should not be retried (despite the 5xx nature).
     */
    VideoCallAtSourceCapacity = 10,
    /**
     * The Chime SDK for JavaScript failed to establish a signaling connection because
     * you or someone else deleted the attendee using the DeleteAttendee API action
     * in your server application. You also should not use the attendee response from
     * the ended meeting that you created with the same ClientRequestToken parameter
     * before.
     * https://docs.aws.amazon.com/chime/latest/APIReference/API_DeleteAttendee.html
     */
    SignalingBadRequest = 11,
    /**
     * The Chime SDK for JavaScript failed to establish a signaling connection to the Chime
     * backend due to an internal server error.
     */
    SignalingInternalServerError = 12,
    /**
     * Received unknown signaling error frame
     */
    SignalingRequestFailed = 13,
    /**
     * Timed out gathering ICE candidates. If in Chrome, this could be an
     * indication that the browser is in a bad state due to a VPN reconnect and
     * the user should try quitting and relaunching the app. See:
     * https://bugs.chromium.org/p/webrtc/issues/detail?id=9097
     */
    ICEGatheringTimeoutWorkaround = 14,
    /**
     * Due to connection health, a reconnect has been triggered.
     */
    ConnectionHealthReconnect = 15,
    /**
     * The realtime API failed in some way. This indicates a fatal problem.
     */
    RealtimeApiFailed = 16,
    /**
     * A task failed for an unknown reason.
     */
    TaskFailed = 17,
    /**
     * Session update produces incompatible SDP.
     */
    IncompatibleSDP = 18,
    /**
     * This can happen when you attempt to join a meeting which has ended or attendee got removed
     */
    TURNCredentialsForbidden = 19,
    /**
     * The attendee is not present.
     */
    NoAttendeePresent = 20,
    /**
     * The meeting was ended because the attendee has been removed.
     */
    AudioAttendeeRemoved = 21,
    /**
     * The attendees Primary meeting credentials have been revoked or deleted.
     */
    AudioVideoWasRemovedFromPrimaryMeeting = 22
}
export default MeetingSessionStatusCode;
