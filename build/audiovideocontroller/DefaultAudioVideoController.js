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
const DefaultActiveSpeakerDetector_1 = require("../activespeakerdetector/DefaultActiveSpeakerDetector");
const DefaultAudioMixController_1 = require("../audiomixcontroller/DefaultAudioMixController");
const AudioProfile_1 = require("../audioprofile/AudioProfile");
const DefaultBrowserBehavior_1 = require("../browserbehavior/DefaultBrowserBehavior");
const ConnectionHealthData_1 = require("../connectionhealthpolicy/ConnectionHealthData");
const SignalingAndMetricsConnectionMonitor_1 = require("../connectionmonitor/SignalingAndMetricsConnectionMonitor");
const MeetingSessionStatus_1 = require("../meetingsession/MeetingSessionStatus");
const MeetingSessionStatusCode_1 = require("../meetingsession/MeetingSessionStatusCode");
const MeetingSessionVideoAvailability_1 = require("../meetingsession/MeetingSessionVideoAvailability");
const DefaultPingPong_1 = require("../pingpong/DefaultPingPong");
const DefaultRealtimeController_1 = require("../realtimecontroller/DefaultRealtimeController");
const AsyncScheduler_1 = require("../scheduler/AsyncScheduler");
const DefaultSessionStateController_1 = require("../sessionstatecontroller/DefaultSessionStateController");
const SessionStateControllerAction_1 = require("../sessionstatecontroller/SessionStateControllerAction");
const SessionStateControllerState_1 = require("../sessionstatecontroller/SessionStateControllerState");
const SessionStateControllerTransitionResult_1 = require("../sessionstatecontroller/SessionStateControllerTransitionResult");
const DefaultSignalingClient_1 = require("../signalingclient/DefaultSignalingClient");
const SignalingClientEventType_1 = require("../signalingclient/SignalingClientEventType");
const SignalingClientVideoSubscriptionConfiguration_1 = require("../signalingclient/SignalingClientVideoSubscriptionConfiguration");
const SignalingProtocol_js_1 = require("../signalingprotocol/SignalingProtocol.js");
const StatsCollector_1 = require("../statscollector/StatsCollector");
const AttachMediaInputTask_1 = require("../task/AttachMediaInputTask");
const CleanRestartedSessionTask_1 = require("../task/CleanRestartedSessionTask");
const CleanStoppedSessionTask_1 = require("../task/CleanStoppedSessionTask");
const CreatePeerConnectionTask_1 = require("../task/CreatePeerConnectionTask");
const CreateSDPTask_1 = require("../task/CreateSDPTask");
const FinishGatheringICECandidatesTask_1 = require("../task/FinishGatheringICECandidatesTask");
const JoinAndReceiveIndexTask_1 = require("../task/JoinAndReceiveIndexTask");
const LeaveAndReceiveLeaveAckTask_1 = require("../task/LeaveAndReceiveLeaveAckTask");
const ListenForVolumeIndicatorsTask_1 = require("../task/ListenForVolumeIndicatorsTask");
const MonitorTask_1 = require("../task/MonitorTask");
const OpenSignalingConnectionTask_1 = require("../task/OpenSignalingConnectionTask");
const ParallelGroupTask_1 = require("../task/ParallelGroupTask");
const PromoteToPrimaryMeetingTask_1 = require("../task/PromoteToPrimaryMeetingTask");
const ReceiveAudioInputTask_1 = require("../task/ReceiveAudioInputTask");
const ReceiveTURNCredentialsTask_1 = require("../task/ReceiveTURNCredentialsTask");
const ReceiveVideoInputTask_1 = require("../task/ReceiveVideoInputTask");
const ReceiveVideoStreamIndexTask_1 = require("../task/ReceiveVideoStreamIndexTask");
const SendAndReceiveDataMessagesTask_1 = require("../task/SendAndReceiveDataMessagesTask");
const SerialGroupTask_1 = require("../task/SerialGroupTask");
const SetLocalDescriptionTask_1 = require("../task/SetLocalDescriptionTask");
const SetRemoteDescriptionTask_1 = require("../task/SetRemoteDescriptionTask");
const SubscribeAndReceiveSubscribeAckTask_1 = require("../task/SubscribeAndReceiveSubscribeAckTask");
const TimeoutTask_1 = require("../task/TimeoutTask");
const WaitForAttendeePresenceTask_1 = require("../task/WaitForAttendeePresenceTask");
const DefaultTransceiverController_1 = require("../transceivercontroller/DefaultTransceiverController");
const SimulcastTransceiverController_1 = require("../transceivercontroller/SimulcastTransceiverController");
const VideoOnlyTransceiverController_1 = require("../transceivercontroller/VideoOnlyTransceiverController");
const Types_1 = require("../utils/Types");
const DefaultVideoCaptureAndEncodeParameter_1 = require("../videocaptureandencodeparameter/DefaultVideoCaptureAndEncodeParameter");
const AllHighestVideoBandwidthPolicy_1 = require("../videodownlinkbandwidthpolicy/AllHighestVideoBandwidthPolicy");
const VideoAdaptiveProbePolicy_1 = require("../videodownlinkbandwidthpolicy/VideoAdaptiveProbePolicy");
const DefaultVideoStreamIdSet_1 = require("../videostreamidset/DefaultVideoStreamIdSet");
const DefaultVideoStreamIndex_1 = require("../videostreamindex/DefaultVideoStreamIndex");
const SimulcastVideoStreamIndex_1 = require("../videostreamindex/SimulcastVideoStreamIndex");
const DefaultVideoTileController_1 = require("../videotilecontroller/DefaultVideoTileController");
const DefaultVideoTileFactory_1 = require("../videotilefactory/DefaultVideoTileFactory");
const DefaultSimulcastUplinkPolicy_1 = require("../videouplinkbandwidthpolicy/DefaultSimulcastUplinkPolicy");
const NScaleVideoUplinkBandwidthPolicy_1 = require("../videouplinkbandwidthpolicy/NScaleVideoUplinkBandwidthPolicy");
const DefaultVolumeIndicatorAdapter_1 = require("../volumeindicatoradapter/DefaultVolumeIndicatorAdapter");
const AudioVideoControllerState_1 = require("./AudioVideoControllerState");
class DefaultAudioVideoController {
    constructor(configuration, logger, webSocketAdapter, mediaStreamBroker, reconnectController, eventController) {
        this._audioProfile = new AudioProfile_1.default();
        this.connectionHealthData = new ConnectionHealthData_1.default();
        this.observerQueue = new Set();
        this.meetingSessionContext = new AudioVideoControllerState_1.default();
        this.enableSimulcast = false;
        this.useUpdateTransceiverControllerForUplink = false;
        this.totalRetryCount = 0;
        this.startAudioVideoTimestamp = 0;
        this.mayNeedRenegotiationForSimulcastLayerChange = false;
        // Stored solely to trigger demotion callback on disconnection (expected behavior).
        //
        // We otherwise intentionally do not use this for any other behavior to avoid the complexity
        // of the added state.
        this.promotedToPrimaryMeeting = false;
        this.hasGetRTCPeerConnectionStatsDeprecationMessageBeenSent = false;
        // `connectWithPromises`, `connectWithTasks`, and `actionUpdateWithRenegotiation` all
        // contains a significant portion of asynchronous tasks, so we need to explicitly defer
        // any task operation which may be performed on the event queue that may modify
        // mutable state in `MeetingSessionContext`, as this mutable state needs to be consistent over the course of the update.
        //
        // Currently this includes
        // * `ReceiveVideoStreamIndexTask` which updates `videosToReceive` and `videoCaptureAndEncodeParameter`
        // * `MonitorTask` which updates `videosToReceive`
        this.receiveIndexTask = undefined;
        this.monitorTask = undefined;
        this.destroyed = false;
        /** @internal */
        this.usePromises = true;
        this._logger = logger;
        this.sessionStateController = new DefaultSessionStateController_1.default(this._logger);
        this._configuration = configuration;
        this.enableSimulcast =
            configuration.enableSimulcastForUnifiedPlanChromiumBasedBrowsers &&
                new DefaultBrowserBehavior_1.default().hasChromiumWebRTC();
        this._webSocketAdapter = webSocketAdapter;
        this._realtimeController = new DefaultRealtimeController_1.default(mediaStreamBroker);
        this._realtimeController.realtimeSetLocalAttendeeId(configuration.credentials.attendeeId, configuration.credentials.externalUserId);
        this._mediaStreamBroker = mediaStreamBroker;
        this._reconnectController = reconnectController;
        this._videoTileController = new DefaultVideoTileController_1.default(new DefaultVideoTileFactory_1.default(), this, this._logger);
        this._audioMixController = new DefaultAudioMixController_1.default(this._logger);
        this.meetingSessionContext.logger = this._logger;
        this._eventController = eventController;
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            this.observerQueue.clear();
            this.destroyed = true;
        });
    }
    get configuration() {
        return this._configuration;
    }
    get realtimeController() {
        return this._realtimeController;
    }
    get activeSpeakerDetector() {
        // Lazy init.
        if (!this._activeSpeakerDetector) {
            this._activeSpeakerDetector = new DefaultActiveSpeakerDetector_1.default(this._realtimeController, this._configuration.credentials.attendeeId, this.handleHasBandwidthPriority.bind(this));
        }
        return this._activeSpeakerDetector;
    }
    get videoTileController() {
        return this._videoTileController;
    }
    get audioMixController() {
        return this._audioMixController;
    }
    get logger() {
        return this._logger;
    }
    get rtcPeerConnection() {
        return (this.meetingSessionContext && this.meetingSessionContext.peer) || null;
    }
    get mediaStreamBroker() {
        return this._mediaStreamBroker;
    }
    get eventController() {
        return this._eventController;
    }
    /**
     * This API will be deprecated in favor of `ClientMetricReport.getRTCStatsReport()`.
     *
     * It makes an additional call to the `getStats` API and therefore may cause slight performance degradation.
     *
     * Please subscribe to `metricsDidReceive(clientMetricReport: ClientMetricReport)` callback,
     * and get the raw `RTCStatsReport` via `clientMetricReport.getRTCStatsReport()`.
     */
    getRTCPeerConnectionStats(selector) {
        /* istanbul ignore else */
        if (!this.hasGetRTCPeerConnectionStatsDeprecationMessageBeenSent) {
            this.logger.warn('The `getRTCPeerConnectionStats()` is on its way to be deprecated. It makes an additional call to the `getStats` API and therefore may cause slight performance degradation. Please use the new API `clientMetricReport.getRTCStatsReport()` returned by `metricsDidReceive(clientMetricReport)` callback instead.');
            this.hasGetRTCPeerConnectionStatsDeprecationMessageBeenSent = true;
        }
        if (!this.rtcPeerConnection) {
            return null;
        }
        return this.rtcPeerConnection.getStats(selector);
    }
    setAudioProfile(audioProfile) {
        this._audioProfile = audioProfile;
    }
    addObserver(observer) {
        this.logger.info('adding meeting observer');
        this.observerQueue.add(observer);
    }
    removeObserver(observer) {
        this.logger.info('removing meeting observer');
        this.observerQueue.delete(observer);
    }
    forEachObserver(observerFunc) {
        for (const observer of this.observerQueue) {
            AsyncScheduler_1.default.nextTick(() => {
                if (this.observerQueue.has(observer)) {
                    observerFunc(observer);
                }
            });
        }
    }
    initSignalingClient() {
        if (this.meetingSessionContext.signalingClient) {
            return;
        }
        this.connectionHealthData.reset();
        this.meetingSessionContext = new AudioVideoControllerState_1.default();
        this.meetingSessionContext.logger = this.logger;
        this.meetingSessionContext.eventController = this.eventController;
        this.meetingSessionContext.browserBehavior = new DefaultBrowserBehavior_1.default();
        this.meetingSessionContext.meetingSessionConfiguration = this.configuration;
        this.meetingSessionContext.signalingClient = new DefaultSignalingClient_1.default(this._webSocketAdapter, this.logger);
    }
    uninstallPreStartObserver() {
        this.meetingSessionContext.signalingClient.removeObserver(this.preStartObserver);
        this.preStartObserver = undefined;
    }
    prestart() {
        this.logger.info('Pre-connecting signaling connection.');
        return this.createOrReuseSignalingTask()
            .run()
            .then(() => {
            const handleClosed = () => __awaiter(this, void 0, void 0, function* () {
                this.logger.info('Early connection closed; discarding signaling task.');
                this.signalingTask = undefined;
                this.uninstallPreStartObserver();
            });
            this.preStartObserver = {
                handleSignalingClientEvent(event) {
                    if (event.type === SignalingClientEventType_1.default.WebSocketClosed) {
                        handleClosed();
                    }
                },
            };
            this.meetingSessionContext.signalingClient.registerObserver(this.preStartObserver);
        })
            .catch(e => {
            this.logger.error(`Signaling task pre-start failed: ${e}`);
            // Clean up just in case a subsequent attempt will succeed.
            this.signalingTask = undefined;
        });
    }
    start(options) {
        this.startReturningPromise(options)
            .then(() => {
            this.logger.info('start completed');
        })
            // Just-in-case error handling.
            .catch(
        /* istanbul ignore next */
        e => {
            this.logger.error(`start failed: ${e}`);
        });
    }
    // This is public (albeit marked internal) for tests only.
    /* @internal */
    startReturningPromise(options) {
        if ((options === null || options === void 0 ? void 0 : options.signalingOnly) === true) {
            return this.prestart();
        }
        // For side-effects: lazy getter.
        this.activeSpeakerDetector;
        return new Promise((resolve, reject) => {
            this.sessionStateController.perform(SessionStateControllerAction_1.default.Connect, () => {
                this.actionConnect(false).then(resolve).catch(reject);
            });
        });
    }
    // @ts-ignore
    connectWithPromises(needsToWaitForAttendeePresence) {
        const context = this.meetingSessionContext;
        // Syntactic sugar.
        const timeout = (timeoutMs, task) => {
            return new TimeoutTask_1.default(this.logger, task, timeoutMs);
        };
        // First layer.
        this.monitorTask = new MonitorTask_1.default(context, this.configuration.connectionHealthPolicyConfiguration, this.connectionHealthData);
        const monitor = this.monitorTask.once();
        // Second layer.
        const receiveAudioInput = new ReceiveAudioInputTask_1.default(context).once();
        this.receiveIndexTask = new ReceiveVideoStreamIndexTask_1.default(context);
        // See declaration (unpaused in actionFinishConnecting)
        this.monitorTask.pauseResubscribeCheck();
        this.receiveIndexTask.pauseIngestion();
        const signaling = new SerialGroupTask_1.default(this.logger, 'Signaling', [
            // If pre-connecting, this will be an existing task that has already been run.
            this.createOrReuseSignalingTask(),
            new ListenForVolumeIndicatorsTask_1.default(context),
            new SendAndReceiveDataMessagesTask_1.default(context),
            new JoinAndReceiveIndexTask_1.default(context),
            new ReceiveTURNCredentialsTask_1.default(context),
            this.receiveIndexTask,
        ]).once();
        // Third layer.
        const createPeerConnection = new CreatePeerConnectionTask_1.default(context).once(signaling);
        const attachMediaInput = new AttachMediaInputTask_1.default(context).once(createPeerConnection, receiveAudioInput);
        // Mostly serial section -- kept as promises to allow for finer-grained breakdown.
        const createSDP = new CreateSDPTask_1.default(context).once(attachMediaInput);
        const setLocalDescription = new SetLocalDescriptionTask_1.default(context).once(createSDP);
        const ice = new FinishGatheringICECandidatesTask_1.default(context).once(setLocalDescription);
        const subscribeAck = new SubscribeAndReceiveSubscribeAckTask_1.default(context).once(ice);
        // The ending is a delicate time: we need the connection as a whole to have a timeout,
        // and for the attendee presence timer to not start ticking until after the subscribe/ack.
        return new SerialGroupTask_1.default(this.logger, this.wrapTaskName('AudioVideoStart'), [
            monitor,
            timeout(this.configuration.connectionTimeoutMs, new SerialGroupTask_1.default(this.logger, 'Peer', [
                // The order of these two matters. If canceled, the first one that's still running
                // will contribute any special rejection, and we don't want that to be "attendee not found"!
                subscribeAck,
                needsToWaitForAttendeePresence
                    ? new TimeoutTask_1.default(this.logger, new ParallelGroupTask_1.default(this.logger, 'FinalizeConnection', [
                        new WaitForAttendeePresenceTask_1.default(context),
                        new SetRemoteDescriptionTask_1.default(context),
                    ]), this.meetingSessionContext.meetingSessionConfiguration.attendeePresenceTimeoutMs)
                    : /* istanbul ignore next */ new SetRemoteDescriptionTask_1.default(context),
            ])),
        ]);
    }
    connectWithTasks(needsToWaitForAttendeePresence) {
        this.receiveIndexTask = new ReceiveVideoStreamIndexTask_1.default(this.meetingSessionContext);
        this.monitorTask = new MonitorTask_1.default(this.meetingSessionContext, this.configuration.connectionHealthPolicyConfiguration, this.connectionHealthData);
        // See declaration (unpaused in actionFinishConnecting)
        this.receiveIndexTask.pauseIngestion();
        this.monitorTask.pauseResubscribeCheck();
        return new SerialGroupTask_1.default(this.logger, this.wrapTaskName('AudioVideoStart'), [
            this.monitorTask,
            new ReceiveAudioInputTask_1.default(this.meetingSessionContext),
            new TimeoutTask_1.default(this.logger, new SerialGroupTask_1.default(this.logger, 'Media', [
                new SerialGroupTask_1.default(this.logger, 'Signaling', [
                    new OpenSignalingConnectionTask_1.default(this.meetingSessionContext),
                    new ListenForVolumeIndicatorsTask_1.default(this.meetingSessionContext),
                    new SendAndReceiveDataMessagesTask_1.default(this.meetingSessionContext),
                    new JoinAndReceiveIndexTask_1.default(this.meetingSessionContext),
                    new ReceiveTURNCredentialsTask_1.default(this.meetingSessionContext),
                    this.receiveIndexTask,
                ]),
                new SerialGroupTask_1.default(this.logger, 'Peer', [
                    new CreatePeerConnectionTask_1.default(this.meetingSessionContext),
                    new AttachMediaInputTask_1.default(this.meetingSessionContext),
                    new CreateSDPTask_1.default(this.meetingSessionContext),
                    new SetLocalDescriptionTask_1.default(this.meetingSessionContext),
                    new FinishGatheringICECandidatesTask_1.default(this.meetingSessionContext),
                    new SubscribeAndReceiveSubscribeAckTask_1.default(this.meetingSessionContext),
                    needsToWaitForAttendeePresence
                        ? new TimeoutTask_1.default(this.logger, new ParallelGroupTask_1.default(this.logger, 'FinalizeConnection', [
                            new WaitForAttendeePresenceTask_1.default(this.meetingSessionContext),
                            new SetRemoteDescriptionTask_1.default(this.meetingSessionContext),
                        ]), this.meetingSessionContext.meetingSessionConfiguration.attendeePresenceTimeoutMs)
                        : /* istanbul ignore next */ new SetRemoteDescriptionTask_1.default(this.meetingSessionContext),
                ]),
            ]), this.configuration.connectionTimeoutMs),
        ]);
    }
    actionConnect(reconnecting) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            this.initSignalingClient();
            // We no longer need to watch for the early connection dropping; we're back where
            // we otherwise would have been had we not pre-started.
            this.uninstallPreStartObserver();
            this.meetingSessionContext.mediaStreamBroker = this._mediaStreamBroker;
            this.meetingSessionContext.realtimeController = this._realtimeController;
            this.meetingSessionContext.audioMixController = this._audioMixController;
            this.meetingSessionContext.audioVideoController = this;
            const useAudioConnection = !!this.configuration.urls.audioHostURL;
            if (!useAudioConnection) {
                this.logger.info(`Using video only transceiver controller`);
                this.meetingSessionContext.transceiverController = new VideoOnlyTransceiverController_1.default(this.logger, this.meetingSessionContext.browserBehavior);
            }
            else if (this.enableSimulcast) {
                this.logger.info(`Using transceiver controller with simulcast support`);
                this.meetingSessionContext.transceiverController = new SimulcastTransceiverController_1.default(this.logger, this.meetingSessionContext.browserBehavior);
            }
            else {
                this.logger.info(`Using default transceiver controller`);
                this.meetingSessionContext.transceiverController = new DefaultTransceiverController_1.default(this.logger, this.meetingSessionContext.browserBehavior);
            }
            this.meetingSessionContext.volumeIndicatorAdapter = new DefaultVolumeIndicatorAdapter_1.default(this.logger, this._realtimeController, DefaultAudioVideoController.MIN_VOLUME_DECIBELS, DefaultAudioVideoController.MAX_VOLUME_DECIBELS, this.configuration.credentials.attendeeId);
            this.meetingSessionContext.videoTileController = this._videoTileController;
            this.meetingSessionContext.videoDownlinkBandwidthPolicy = this.configuration.videoDownlinkBandwidthPolicy;
            this.meetingSessionContext.videoUplinkBandwidthPolicy = this.configuration.videoUplinkBandwidthPolicy;
            this.meetingSessionContext.enableSimulcast = this.enableSimulcast;
            if (this.enableSimulcast) {
                let simulcastPolicy = this.meetingSessionContext
                    .videoUplinkBandwidthPolicy;
                if (!simulcastPolicy) {
                    simulcastPolicy = new DefaultSimulcastUplinkPolicy_1.default(this.configuration.credentials.attendeeId, this.meetingSessionContext.logger);
                    this.meetingSessionContext.videoUplinkBandwidthPolicy = simulcastPolicy;
                }
                simulcastPolicy.addObserver(this);
                if (!this.meetingSessionContext.videoDownlinkBandwidthPolicy) {
                    this.meetingSessionContext.videoDownlinkBandwidthPolicy = new VideoAdaptiveProbePolicy_1.default(this.meetingSessionContext.logger);
                }
                this.meetingSessionContext.videoStreamIndex = new SimulcastVideoStreamIndex_1.default(this.logger);
            }
            else {
                this.meetingSessionContext.enableSimulcast = false;
                this.meetingSessionContext.videoStreamIndex = new DefaultVideoStreamIndex_1.default(this.logger);
                if (!this.meetingSessionContext.videoUplinkBandwidthPolicy) {
                    this.meetingSessionContext.videoUplinkBandwidthPolicy = new NScaleVideoUplinkBandwidthPolicy_1.default(this.configuration.credentials.attendeeId, !this.meetingSessionContext.browserBehavior.disableResolutionScaleDown(), this.meetingSessionContext.logger, this.meetingSessionContext.browserBehavior);
                }
                if (!this.meetingSessionContext.videoDownlinkBandwidthPolicy) {
                    this.meetingSessionContext.videoDownlinkBandwidthPolicy = new AllHighestVideoBandwidthPolicy_1.default(this.configuration.credentials.attendeeId);
                }
                if (this.meetingSessionContext.videoUplinkBandwidthPolicy.setTransceiverController &&
                    this.meetingSessionContext.videoUplinkBandwidthPolicy.updateTransceiverController) {
                    this.useUpdateTransceiverControllerForUplink = true;
                    this.meetingSessionContext.videoUplinkBandwidthPolicy.setTransceiverController(this.meetingSessionContext.transceiverController);
                }
                this.meetingSessionContext.audioProfile = this._audioProfile;
            }
            if (this.meetingSessionContext.videoUplinkBandwidthPolicy && this.maxUplinkBandwidthKbps) {
                this.meetingSessionContext.videoUplinkBandwidthPolicy.setIdealMaxBandwidthKbps(this.maxUplinkBandwidthKbps);
            }
            if (this.meetingSessionContext.videoDownlinkBandwidthPolicy.bindToTileController) {
                this.meetingSessionContext.videoDownlinkBandwidthPolicy.bindToTileController(this._videoTileController);
            }
            this.meetingSessionContext.lastKnownVideoAvailability = new MeetingSessionVideoAvailability_1.default();
            this.meetingSessionContext.videoCaptureAndEncodeParameter = new DefaultVideoCaptureAndEncodeParameter_1.default(0, 0, 0, 0, false);
            this.meetingSessionContext.videosToReceive = new DefaultVideoStreamIdSet_1.default();
            this.meetingSessionContext.videosPaused = new DefaultVideoStreamIdSet_1.default();
            this.meetingSessionContext.statsCollector = new StatsCollector_1.default(this, this.logger);
            this.meetingSessionContext.connectionMonitor = new SignalingAndMetricsConnectionMonitor_1.default(this, this._realtimeController, this.connectionHealthData, new DefaultPingPong_1.default(this.meetingSessionContext.signalingClient, DefaultAudioVideoController.PING_PONG_INTERVAL_MS, this.logger), this.meetingSessionContext.statsCollector);
            this.meetingSessionContext.reconnectController = this._reconnectController;
            this.meetingSessionContext.videoDeviceInformation = {};
            if (!reconnecting) {
                this.totalRetryCount = 0;
                this._reconnectController.reset();
                this.startAudioVideoTimestamp = Date.now();
                this.forEachObserver(observer => {
                    Types_1.Maybe.of(observer.audioVideoDidStartConnecting).map(f => f.bind(observer)(false));
                });
                (_a = this.eventController) === null || _a === void 0 ? void 0 : _a.publishEvent('meetingStartRequested');
            }
            this.meetingSessionContext.startAudioVideoTimestamp = this.startAudioVideoTimestamp;
            if (this._reconnectController.hasStartedConnectionAttempt()) {
                // This does not reset the reconnect deadline, but declare it's not the first connection.
                this._reconnectController.startedConnectionAttempt(false);
            }
            else {
                this._reconnectController.startedConnectionAttempt(true);
            }
            // No attendee presence event will be triggered if there is no audio connection.
            // Waiting for attendee presence is explicitly executed
            // if `attendeePresenceTimeoutMs` is configured to larger than 0.
            const needsToWaitForAttendeePresence = useAudioConnection &&
                this.meetingSessionContext.meetingSessionConfiguration.attendeePresenceTimeoutMs > 0;
            this.logger.info('Needs to wait for attendee presence? ' + needsToWaitForAttendeePresence);
            let connect;
            if (this.usePromises) {
                connect = this.connectWithPromises(needsToWaitForAttendeePresence);
            }
            else {
                connect = this.connectWithTasks(needsToWaitForAttendeePresence);
            }
            // The rest.
            try {
                yield connect.run();
                this.connectionHealthData.setConnectionStartTime();
                this._mediaStreamBroker.addMediaStreamBrokerObserver(this);
                this.sessionStateController.perform(SessionStateControllerAction_1.default.FinishConnecting, () => {
                    /* istanbul ignore else */
                    if (this.eventController) {
                        this.meetingSessionContext.meetingStartDurationMs =
                            Date.now() - this.startAudioVideoTimestamp;
                        this.eventController.publishEvent('meetingStartSucceeded', {
                            maxVideoTileCount: this.meetingSessionContext.maxVideoTileCount,
                            poorConnectionCount: this.meetingSessionContext.poorConnectionCount,
                            retryCount: this.totalRetryCount,
                            signalingOpenDurationMs: this.meetingSessionContext.signalingOpenDurationMs,
                            iceGatheringDurationMs: this.meetingSessionContext.iceGatheringDurationMs,
                            meetingStartDurationMs: this.meetingSessionContext.meetingStartDurationMs,
                        });
                    }
                    this.meetingSessionContext.startTimeMs = Date.now();
                    this.actionFinishConnecting();
                });
            }
            catch (error) {
                this.signalingTask = undefined;
                const status = new MeetingSessionStatus_1.default(this.getMeetingStatusCode(error) || MeetingSessionStatusCode_1.default.TaskFailed);
                this.logger.info(`Start failed: ${status} due to error ${error}.`);
                // I am not able to successfully reach this state in the test suite with mock
                // websockets -- it always ends up in 'Disconnecting' instead. As such, this
                // has to be marked for Istanbul.
                /* istanbul ignore if */
                if (this.sessionStateController.state() === SessionStateControllerState_1.default.NotConnected) {
                    // There's no point trying to 'disconnect', because we're not connected.
                    // The session state controller will bail.
                    this.logger.info('Start failed and not connected. Not cleaning up.');
                    return;
                }
                this.sessionStateController.perform(SessionStateControllerAction_1.default.Fail, () => __awaiter(this, void 0, void 0, function* () {
                    yield this.actionDisconnect(status, true, error);
                    if (!this.handleMeetingSessionStatus(status, error)) {
                        this.notifyStop(status, error);
                    }
                }));
            }
        });
    }
    createOrReuseSignalingTask() {
        if (!this.signalingTask) {
            this.initSignalingClient();
            this.signalingTask = new TimeoutTask_1.default(this.logger, new OpenSignalingConnectionTask_1.default(this.meetingSessionContext), this.configuration.connectionTimeoutMs).once();
        }
        return this.signalingTask;
    }
    actionFinishConnecting() {
        this.signalingTask = undefined;
        this.meetingSessionContext.videoDuplexMode = SignalingProtocol_js_1.SdkStreamServiceType.RX;
        if (!this.meetingSessionContext.enableSimulcast) {
            if (this.useUpdateTransceiverControllerForUplink) {
                this.meetingSessionContext.videoUplinkBandwidthPolicy.updateTransceiverController();
            }
            else {
                this.enforceBandwidthLimitationForSender(this.meetingSessionContext.videoCaptureAndEncodeParameter.encodeBitrates()[0]);
            }
        }
        this.forEachObserver(observer => {
            Types_1.Maybe.of(observer.audioVideoDidStart).map(f => f.bind(observer)());
        });
        this._reconnectController.reset();
        // `receiveIndexTask` needs to be resumed first so it can set `remoteStreamDescriptions`
        this.receiveIndexTask.resumeIngestion();
        this.monitorTask.resumeResubscribeCheck();
    }
    /* @internal */
    stopReturningPromise() {
        var _a;
        // In order to avoid breaking backward compatibility, when only the
        // signaling connection is established we appear to not be connected.
        // We handle this by simply disconnecting the websocket directly.
        if (this.sessionStateController.state() === SessionStateControllerState_1.default.NotConnected) {
            // Unfortunately, this does not return a promise.
            (_a = this.meetingSessionContext.signalingClient) === null || _a === void 0 ? void 0 : _a.closeConnection();
            this.meetingSessionContext.signalingClient = null; // See comment in `actionDisconnect`
            this.cleanUpMediaStreamsAfterStop();
            return Promise.resolve();
        }
        /*
          Stops the current audio video meeting session.
          The stop method execution is deferred and executed after
          the current reconnection attempt completes.
          It disables any further reconnection attempts.
          Upon completion, AudioVideoObserver's `audioVideoDidStop`
          callback function is called with `MeetingSessionStatusCode.Left`.
        */
        return new Promise((resolve, reject) => {
            this.sessionStateController.perform(SessionStateControllerAction_1.default.Disconnect, () => {
                this._reconnectController.disableReconnect();
                this.logger.info('attendee left meeting, session will not be reconnected');
                this.actionDisconnect(new MeetingSessionStatus_1.default(MeetingSessionStatusCode_1.default.Left), false, null)
                    .then(resolve)
                    .catch(reject);
            });
        });
    }
    stop() {
        this.stopReturningPromise();
    }
    actionDisconnect(status, reconnecting, error) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield new SerialGroupTask_1.default(this.logger, this.wrapTaskName('AudioVideoStop'), [
                    new TimeoutTask_1.default(this.logger, new LeaveAndReceiveLeaveAckTask_1.default(this.meetingSessionContext), this.configuration.connectionTimeoutMs),
                ]).run();
            }
            catch (stopError) {
                this.logger.info('fail to stop');
            }
            try {
                const subtasks = [
                    new TimeoutTask_1.default(this.logger, new CleanStoppedSessionTask_1.default(this.meetingSessionContext), this.configuration.connectionTimeoutMs),
                ];
                this.cleanUpMediaStreamsAfterStop();
                yield new SerialGroupTask_1.default(this.logger, this.wrapTaskName('AudioVideoClean'), subtasks).run();
            }
            catch (cleanError) {
                /* istanbul ignore next */
                this.logger.info('fail to clean');
            }
            this.sessionStateController.perform(SessionStateControllerAction_1.default.FinishDisconnecting, () => {
                if (!reconnecting) {
                    // Do a hard reset of the signaling client in case this controller is reused;
                    // this will also can `this.meetingSessionContext` to be reset if reused.
                    this.meetingSessionContext.signalingClient = null;
                    this.notifyStop(status, error);
                }
            });
        });
    }
    update(options = { needsRenegotiation: true }) {
        let needsRenegotiation = options.needsRenegotiation;
        // Check in case this function has been called before peer connection is set up
        // since that is necessary to try to update remote videos without the full resubscribe path
        needsRenegotiation || (needsRenegotiation = this.meetingSessionContext.peer === undefined);
        // If updating local or remote video without negotiation fails, fall back to renegotiation
        needsRenegotiation || (needsRenegotiation = !this.updateRemoteVideosFromLastVideosToReceive());
        needsRenegotiation || (needsRenegotiation = !this.updateLocalVideoFromPolicy());
        // `MeetingSessionContext.lastVideosToReceive` needs to be updated regardless
        this.meetingSessionContext.lastVideosToReceive = this.meetingSessionContext.videosToReceive;
        if (!needsRenegotiation) {
            this.logger.info('Update request does not require resubscribe');
            // Call `actionFinishUpdating` to apply the new encoding parameters that may have been set in `updateLocalVideoFromPolicy`.
            this.actionFinishUpdating();
            return true; // Skip the subscribe!
        }
        this.logger.info('Update request requires resubscribe');
        const result = this.sessionStateController.perform(SessionStateControllerAction_1.default.Update, () => {
            this.actionUpdateWithRenegotiation(true);
        });
        return (result === SessionStateControllerTransitionResult_1.default.Transitioned ||
            result === SessionStateControllerTransitionResult_1.default.DeferredTransition);
    }
    // This function will try to use the diff between `this.meetingSessionContext.lastVideosToReceive`
    // and `this.meetingSessionContext.videosToReceive` to determine if the changes can be accomplished
    // through `SignalingClient.remoteVideoUpdate` rather then the full subscribe.
    //
    // It requires the caller to manage `this.meetingSessionContext.lastVideosToReceive`
    // and `this.meetingSessionContext.videosToReceive` so that `this.meetingSessionContext.lastVideosToReceive`
    // contains the stream IDs from either last time a subscribe was set, or last time this function was set.
    //
    // It will return true if succesful, if false the caller must fall back to a full renegotiation
    updateRemoteVideosFromLastVideosToReceive() {
        var _a, _b;
        const context = this.meetingSessionContext;
        if (((_a = context.videosToReceive) === null || _a === void 0 ? void 0 : _a.empty()) || ((_b = context.lastVideosToReceive) === null || _b === void 0 ? void 0 : _b.empty())) {
            return false;
        }
        // Check existence of all required dependencies and requisite functions
        if (!context.transceiverController ||
            !context.transceiverController.getMidForStreamId ||
            !context.transceiverController.setStreamIdForMid ||
            !context.videosToReceive.forEach ||
            !context.signalingClient.remoteVideoUpdate ||
            !context.videoStreamIndex.overrideStreamIdMappings) {
            return false;
        }
        let added = [];
        const simulcastStreamUpdates = new Map();
        let removed = [];
        if (context.lastVideosToReceive === null) {
            added = context.videosToReceive.array();
        }
        else {
            const index = context.videoStreamIndex;
            context.videosToReceive.forEach((currentId) => {
                if (context.lastVideosToReceive.contain(currentId)) {
                    return;
                }
                // Check if group ID exists in previous set (i.e. simulcast stream switch)
                let foundUpdatedPreviousStreamId = false;
                context.lastVideosToReceive.forEach((previousId) => {
                    if (foundUpdatedPreviousStreamId) {
                        return; // Short circuit since we have already found it
                    }
                    if (index.StreamIdsInSameGroup(previousId, currentId)) {
                        simulcastStreamUpdates.set(previousId, currentId);
                        foundUpdatedPreviousStreamId = true;
                    }
                });
                if (!foundUpdatedPreviousStreamId) {
                    // Otherwise this must be a new stream
                    added.push(currentId);
                }
            });
            removed = context.lastVideosToReceive.array().filter(idFromPrevious => {
                const stillReceiving = context.videosToReceive.contain(idFromPrevious);
                const isUpdated = simulcastStreamUpdates.has(idFromPrevious);
                return !stillReceiving && !isUpdated;
            });
        }
        this.logger.info(`Request to update remote videos with added: ${added}, updated: ${[
            ...simulcastStreamUpdates.entries(),
        ]}, removed: ${removed}`);
        const updatedVideoSubscriptionConfigurations = [];
        for (const [previousId, currentId] of simulcastStreamUpdates.entries()) {
            const updatedConfig = new SignalingClientVideoSubscriptionConfiguration_1.default();
            updatedConfig.streamId = currentId;
            updatedConfig.attendeeId = context.videoStreamIndex.attendeeIdForStreamId(currentId);
            updatedConfig.mid = context.transceiverController.getMidForStreamId(previousId);
            if (updatedConfig.mid === undefined) {
                this.logger.info(`No MID found for stream ID ${previousId}, cannot update stream without renegotiation`);
                return false;
            }
            updatedVideoSubscriptionConfigurations.push(updatedConfig);
            // We need to override some other components dependent on the subscribe paths for certain functionality
            context.transceiverController.setStreamIdForMid(updatedConfig.mid, currentId);
            context.videoStreamIndex.overrideStreamIdMappings(previousId, currentId);
            if (context.videoTileController.haveVideoTileForAttendeeId(updatedConfig.attendeeId)) {
                const tile = context.videoTileController.getVideoTileForAttendeeId(updatedConfig.attendeeId);
                if (!tile.setStreamId) {
                    // Required function
                    return false;
                }
                tile.setStreamId(currentId);
            }
        }
        if (updatedVideoSubscriptionConfigurations.length !== 0) {
            context.signalingClient.remoteVideoUpdate(updatedVideoSubscriptionConfigurations, []);
        }
        // Only simulcast stream switches (i.e. not add/remove/source switches) are possible currently
        if (added.length !== 0 || removed.length !== 0) {
            return false;
        }
        return true;
    }
    updateLocalVideoFromPolicy() {
        // Try updating parameters without renegotiation
        if (this.meetingSessionContext.enableSimulcast) {
            // The following may result in `this.mayNeedRenegotiationForSimulcastLayerChange` being switched on
            const encodingParam = this.meetingSessionContext.videoUplinkBandwidthPolicy.chooseEncodingParameters();
            if (this.mayNeedRenegotiationForSimulcastLayerChange &&
                !this.negotiatedBitrateLayersAllocationRtpHeaderExtension()) {
                this.logger.info('Needs regenotiation for local video simulcast layer change');
                this.mayNeedRenegotiationForSimulcastLayerChange = false;
                return false;
            }
            this.meetingSessionContext.transceiverController.setEncodingParameters(encodingParam);
        }
        else {
            this.meetingSessionContext.videoCaptureAndEncodeParameter = this.meetingSessionContext.videoUplinkBandwidthPolicy.chooseCaptureAndEncodeParameters();
            // Bitrate will be set in `actionFinishUpdating`. This should never need a resubscribe.
        }
        this.logger.info('Updated local video from policy without renegotiation');
        return true;
    }
    negotiatedBitrateLayersAllocationRtpHeaderExtension() {
        if (!this.meetingSessionContext.transceiverController.localVideoTransceiver()) {
            return false;
        }
        const parameters = this.meetingSessionContext.transceiverController
            .localVideoTransceiver()
            .sender.getParameters();
        if (!parameters || !parameters.headerExtensions) {
            return false;
        }
        return parameters.headerExtensions.some(extension => extension.uri === 'http://www.webrtc.org/experiments/rtp-hdrext/video-layers-allocation00');
    }
    restartLocalVideo(callback) {
        const restartVideo = () => __awaiter(this, void 0, void 0, function* () {
            if (this._videoTileController.hasStartedLocalVideoTile()) {
                this.logger.info('stopping local video tile prior to local video restart');
                this._videoTileController.stopLocalVideoTile();
                this.logger.info('preparing local video restart update');
                yield this.actionUpdateWithRenegotiation(false);
                this.logger.info('starting local video tile for local video restart');
                this._videoTileController.startLocalVideoTile();
            }
            this.logger.info('finalizing local video restart update');
            yield this.actionUpdateWithRenegotiation(true);
            callback();
        });
        const result = this.sessionStateController.perform(SessionStateControllerAction_1.default.Update, () => {
            restartVideo();
        });
        return (result === SessionStateControllerTransitionResult_1.default.Transitioned ||
            result === SessionStateControllerTransitionResult_1.default.DeferredTransition);
    }
    replaceLocalVideo(videoStream) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!videoStream || videoStream.getVideoTracks().length < 1) {
                throw new Error('could not acquire video track');
            }
            if (!this.meetingSessionContext || !this.meetingSessionContext.peer) {
                throw new Error('no active meeting and peer connection');
            }
            // if there is a local tile, a video tile update event should be fired.
            const localTile = this.meetingSessionContext.videoTileController.getLocalVideoTile();
            if (localTile) {
                const state = localTile.state();
                const settings = videoStream.getVideoTracks()[0].getSettings();
                // so tile update wil be fired.
                localTile.bindVideoStream(state.boundAttendeeId, true, videoStream, settings.width, settings.height, state.streamId, state.boundExternalUserId);
            }
            yield this.meetingSessionContext.transceiverController.setVideoInput(videoStream.getVideoTracks()[0]);
            // Update the active video input on subscription context to match what we just changed
            // so that subsequent meeting actions can reuse and destroy it.
            this.meetingSessionContext.activeVideoInput = videoStream;
            this.logger.info('Local video input is updated');
        });
    }
    replaceLocalAudio(audioStream) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!audioStream || audioStream.getAudioTracks().length < 1) {
                throw new Error('could not acquire audio track');
            }
            if (!this.meetingSessionContext || !this.meetingSessionContext.peer) {
                throw new Error('no active meeting and peer connection');
            }
            this.connectionHealthData.reset();
            this.connectionHealthData.setConnectionStartTime();
            const replaceTrackSuccess = yield this.meetingSessionContext.transceiverController.replaceAudioTrack(audioStream.getAudioTracks()[0]);
            if (!replaceTrackSuccess) {
                throw new Error('Failed to replace audio track');
            }
            this.meetingSessionContext.activeAudioInput = audioStream;
            this.logger.info('Local audio input is updated');
        });
    }
    actionUpdateWithRenegotiation(notify) {
        return __awaiter(this, void 0, void 0, function* () {
            // See declaration (unpaused in actionFinishUpdating)
            // The operations in `update` do not need this protection because they are synchronous.
            this.monitorTask.pauseResubscribeCheck();
            this.receiveIndexTask.pauseIngestion();
            // TODO: do not block other updates while waiting for video input
            try {
                yield new SerialGroupTask_1.default(this.logger, this.wrapTaskName('AudioVideoUpdate'), [
                    new ReceiveVideoInputTask_1.default(this.meetingSessionContext),
                    new TimeoutTask_1.default(this.logger, new SerialGroupTask_1.default(this.logger, 'UpdateSession', [
                        new AttachMediaInputTask_1.default(this.meetingSessionContext),
                        new CreateSDPTask_1.default(this.meetingSessionContext),
                        new SetLocalDescriptionTask_1.default(this.meetingSessionContext),
                        new FinishGatheringICECandidatesTask_1.default(this.meetingSessionContext),
                        new SubscribeAndReceiveSubscribeAckTask_1.default(this.meetingSessionContext),
                        new SetRemoteDescriptionTask_1.default(this.meetingSessionContext),
                    ]), this.configuration.connectionTimeoutMs),
                ]).run();
                if (notify) {
                    this.sessionStateController.perform(SessionStateControllerAction_1.default.FinishUpdating, () => {
                        this.actionFinishUpdating();
                    });
                }
            }
            catch (error) {
                this.sessionStateController.perform(SessionStateControllerAction_1.default.FinishUpdating, () => {
                    const status = new MeetingSessionStatus_1.default(this.getMeetingStatusCode(error) || MeetingSessionStatusCode_1.default.TaskFailed);
                    if (status.statusCode() !== MeetingSessionStatusCode_1.default.IncompatibleSDP) {
                        this.logger.info('failed to update audio-video session');
                    }
                    this.handleMeetingSessionStatus(status, error);
                });
            }
        });
    }
    notifyStop(status, error) {
        var _a;
        this.forEachObserver(observer => {
            Types_1.Maybe.of(observer.audioVideoDidStop).map(f => f.bind(observer)(status));
        });
        if (this.promotedToPrimaryMeeting && error) {
            this.forEachObserver(observer => {
                this.promotedToPrimaryMeeting = false;
                Types_1.Maybe.of(observer.audioVideoWasDemotedFromPrimaryMeeting).map(f => f.bind(observer)(new MeetingSessionStatus_1.default(MeetingSessionStatusCode_1.default.SignalingInternalServerError)));
            });
        }
        /* istanbul ignore else */
        if (this.eventController) {
            const { signalingOpenDurationMs, poorConnectionCount, startTimeMs, iceGatheringDurationMs, attendeePresenceDurationMs, meetingStartDurationMs, } = this.meetingSessionContext;
            const attributes = {
                maxVideoTileCount: this.meetingSessionContext.maxVideoTileCount,
                meetingDurationMs: startTimeMs === null ? 0 : Math.round(Date.now() - startTimeMs),
                meetingStatus: MeetingSessionStatusCode_1.default[status.statusCode()],
                signalingOpenDurationMs,
                iceGatheringDurationMs,
                attendeePresenceDurationMs,
                poorConnectionCount,
                meetingStartDurationMs,
                retryCount: this.totalRetryCount,
            };
            /* istanbul ignore next: toString is optional */
            const meetingErrorMessage = (error && error.message) || ((_a = status.toString) === null || _a === void 0 ? void 0 : _a.call(status)) || '';
            if (attributes.meetingDurationMs === 0) {
                attributes.meetingErrorMessage = meetingErrorMessage;
                delete attributes.meetingDurationMs;
                delete attributes.attendeePresenceDurationMs;
                delete attributes.meetingStartDurationMs;
                this.eventController.publishEvent('meetingStartFailed', attributes);
            }
            else if (status.isFailure() || status.isAudioConnectionFailure()) {
                attributes.meetingErrorMessage = meetingErrorMessage;
                this.eventController.publishEvent('meetingFailed', attributes);
            }
            else {
                this.eventController.publishEvent('meetingEnded', attributes);
            }
        }
    }
    actionFinishUpdating() {
        // we do not update parameter for simulcast since they are updated in AttachMediaInputTask
        if (!this.meetingSessionContext.enableSimulcast) {
            if (this.useUpdateTransceiverControllerForUplink) {
                this.meetingSessionContext.videoUplinkBandwidthPolicy.updateTransceiverController();
            }
            else {
                const maxBitrateKbps = this.meetingSessionContext.videoCaptureAndEncodeParameter.encodeBitrates()[0];
                this.enforceBandwidthLimitationForSender(maxBitrateKbps);
            }
        }
        this.monitorTask.resumeResubscribeCheck();
        this.receiveIndexTask.resumeIngestion();
        this.logger.info('updated audio-video session');
    }
    reconnect(status, error) {
        const willRetry = this._reconnectController.retryWithBackoff(() => __awaiter(this, void 0, void 0, function* () {
            if (this.sessionStateController.state() === SessionStateControllerState_1.default.NotConnected) {
                this.sessionStateController.perform(SessionStateControllerAction_1.default.Connect, () => {
                    this.actionConnect(true);
                });
            }
            else {
                this.sessionStateController.perform(SessionStateControllerAction_1.default.Reconnect, () => {
                    this.actionReconnect(status);
                });
            }
            this.totalRetryCount += 1;
        }), () => {
            this.logger.info('canceled retry');
        });
        if (!willRetry) {
            this.sessionStateController.perform(SessionStateControllerAction_1.default.Fail, () => {
                this.actionDisconnect(status, false, error);
            });
        }
        return willRetry;
    }
    actionReconnect(status) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._reconnectController.hasStartedConnectionAttempt()) {
                this._reconnectController.startedConnectionAttempt(false);
                this.forEachObserver(observer => {
                    Types_1.Maybe.of(observer.audioVideoDidStartConnecting).map(f => f.bind(observer)(true));
                });
            }
            this.meetingSessionContext.volumeIndicatorAdapter.onReconnect();
            this.connectionHealthData.reset();
            try {
                yield new SerialGroupTask_1.default(this.logger, this.wrapTaskName('AudioVideoReconnect'), [
                    new TimeoutTask_1.default(this.logger, new SerialGroupTask_1.default(this.logger, 'Media', [
                        new CleanRestartedSessionTask_1.default(this.meetingSessionContext),
                        new SerialGroupTask_1.default(this.logger, 'Signaling', [
                            new OpenSignalingConnectionTask_1.default(this.meetingSessionContext),
                            new JoinAndReceiveIndexTask_1.default(this.meetingSessionContext),
                            new ReceiveTURNCredentialsTask_1.default(this.meetingSessionContext),
                        ]),
                        new CreatePeerConnectionTask_1.default(this.meetingSessionContext),
                    ]), this.configuration.connectionTimeoutMs),
                    // TODO: Do we need ReceiveVideoInputTask in the reconnect operation?
                    new ReceiveVideoInputTask_1.default(this.meetingSessionContext),
                    new TimeoutTask_1.default(this.logger, new SerialGroupTask_1.default(this.logger, 'UpdateSession', [
                        new AttachMediaInputTask_1.default(this.meetingSessionContext),
                        new CreateSDPTask_1.default(this.meetingSessionContext),
                        new SetLocalDescriptionTask_1.default(this.meetingSessionContext),
                        new FinishGatheringICECandidatesTask_1.default(this.meetingSessionContext),
                        new SubscribeAndReceiveSubscribeAckTask_1.default(this.meetingSessionContext),
                        new SetRemoteDescriptionTask_1.default(this.meetingSessionContext),
                    ]), this.configuration.connectionTimeoutMs),
                ]).run();
                this.sessionStateController.perform(SessionStateControllerAction_1.default.FinishConnecting, () => {
                    /* istanbul ignore else */
                    if (this.eventController) {
                        const { signalingOpenDurationMs, poorConnectionCount, startTimeMs, iceGatheringDurationMs, attendeePresenceDurationMs, meetingStartDurationMs, } = this.meetingSessionContext;
                        const attributes = {
                            maxVideoTileCount: this.meetingSessionContext.maxVideoTileCount,
                            meetingDurationMs: Math.round(Date.now() - startTimeMs),
                            meetingStatus: MeetingSessionStatusCode_1.default[status.statusCode()],
                            signalingOpenDurationMs,
                            iceGatheringDurationMs,
                            attendeePresenceDurationMs,
                            poorConnectionCount,
                            meetingStartDurationMs,
                            retryCount: this.totalRetryCount,
                        };
                        this.eventController.publishEvent('meetingReconnected', attributes);
                    }
                    this.actionFinishConnecting();
                });
            }
            catch (error) {
                // To perform the "Reconnect" action again, the session should be in the "Connected" state.
                this.sessionStateController.perform(SessionStateControllerAction_1.default.FinishConnecting, () => {
                    this.logger.info('failed to reconnect audio-video session');
                    const status = new MeetingSessionStatus_1.default(this.getMeetingStatusCode(error) || MeetingSessionStatusCode_1.default.TaskFailed);
                    this.handleMeetingSessionStatus(status, error);
                });
            }
            this.connectionHealthData.setConnectionStartTime();
        });
    }
    wrapTaskName(taskName) {
        return `${taskName}/${this.configuration.meetingId}/${this.configuration.credentials.attendeeId}`;
    }
    cleanUpMediaStreamsAfterStop() {
        this._mediaStreamBroker.removeMediaStreamBrokerObserver(this);
        this.meetingSessionContext.activeAudioInput = undefined;
        this.meetingSessionContext.activeVideoInput = undefined;
    }
    // Extract the meeting status from `Error.message`, relying on specific phrasing
    // 'the meeting status code ${CODE}`.
    //
    // e.g. reject(new Error(
    //        `canceling ${this.name()} due to the meeting status code: ${MeetingSessionStatusCode.MeetingEnded}`));
    getMeetingStatusCode(error) {
        const matched = /the meeting status code: (\d+)/.exec(error && error.message);
        if (matched && matched.length > 1) {
            return Number.parseInt(matched[1], 10);
        }
        return null;
    }
    enforceBandwidthLimitationForSender(maxBitrateKbps) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.meetingSessionContext.transceiverController.setVideoSendingBitrateKbps(maxBitrateKbps);
        });
    }
    handleMeetingSessionStatus(status, error) {
        this.logger.info(`handling status: ${MeetingSessionStatusCode_1.default[status.statusCode()]}`);
        if (!status.isTerminal()) {
            if (this.meetingSessionContext.statsCollector) {
                this.meetingSessionContext.statsCollector.logMeetingSessionStatus(status);
            }
        }
        if (status.statusCode() === MeetingSessionStatusCode_1.default.IncompatibleSDP) {
            this.restartLocalVideo(() => {
                this.logger.info('handled incompatible SDP by attempting to restart video');
            });
            return true;
        }
        if (status.statusCode() === MeetingSessionStatusCode_1.default.VideoCallSwitchToViewOnly) {
            this._videoTileController.removeLocalVideoTile();
            this.forEachObserver((observer) => {
                Types_1.Maybe.of(observer.videoSendDidBecomeUnavailable).map(f => f.bind(observer)());
            });
            return false;
        }
        if (status.statusCode() === MeetingSessionStatusCode_1.default.AudioVideoWasRemovedFromPrimaryMeeting) {
            this.forEachObserver((observer) => {
                Types_1.Maybe.of(observer.audioVideoWasDemotedFromPrimaryMeeting).map(f => f.bind(observer)(status));
            });
            return false;
        }
        if (status.isTerminal()) {
            this.logger.error('session will not be reconnected');
            if (this.meetingSessionContext.reconnectController) {
                this.meetingSessionContext.reconnectController.disableReconnect();
            }
        }
        if (status.isFailure() || status.isTerminal()) {
            if (this.meetingSessionContext.reconnectController) {
                const willRetry = this.reconnect(status, error);
                if (willRetry) {
                    this.logger.warn(`will retry due to status code ${MeetingSessionStatusCode_1.default[status.statusCode()]}${error ? ` and error: ${error.message}` : ``}`);
                }
                else {
                    this.logger.error(`failed with status code ${MeetingSessionStatusCode_1.default[status.statusCode()]}${error ? ` and error: ${error.message}` : ``}`);
                }
                return willRetry;
            }
        }
        return false;
    }
    setVideoMaxBandwidthKbps(maxBandwidthKbps) {
        if (maxBandwidthKbps <= 0) {
            throw new Error('Max bandwidth kbps has to be greater than 0');
        }
        if (this.meetingSessionContext && this.meetingSessionContext.videoUplinkBandwidthPolicy) {
            this.logger.info(`video send has ideal max bandwidth ${maxBandwidthKbps} kbps`);
            this.meetingSessionContext.videoUplinkBandwidthPolicy.setIdealMaxBandwidthKbps(maxBandwidthKbps);
        }
        this.maxUplinkBandwidthKbps = maxBandwidthKbps;
    }
    handleHasBandwidthPriority(hasBandwidthPriority) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.meetingSessionContext &&
                this.meetingSessionContext.videoUplinkBandwidthPolicy &&
                !this.meetingSessionContext.enableSimulcast) {
                if (this.useUpdateTransceiverControllerForUplink) {
                    this.meetingSessionContext.videoUplinkBandwidthPolicy.setHasBandwidthPriority(hasBandwidthPriority);
                    yield this.meetingSessionContext.videoUplinkBandwidthPolicy.updateTransceiverController();
                    return;
                }
                const oldMaxBandwidth = this.meetingSessionContext.videoUplinkBandwidthPolicy.maxBandwidthKbps();
                this.meetingSessionContext.videoUplinkBandwidthPolicy.setHasBandwidthPriority(hasBandwidthPriority);
                const newMaxBandwidth = this.meetingSessionContext.videoUplinkBandwidthPolicy.maxBandwidthKbps();
                if (oldMaxBandwidth !== newMaxBandwidth) {
                    this.logger.info(`video send bandwidth priority ${hasBandwidthPriority} max has changed from ${oldMaxBandwidth} kbps to ${newMaxBandwidth} kbps`);
                    yield this.enforceBandwidthLimitationForSender(newMaxBandwidth);
                }
            }
        });
    }
    pauseReceivingStream(streamId) {
        if (!!this.meetingSessionContext && this.meetingSessionContext.signalingClient) {
            this.meetingSessionContext.signalingClient.pause([streamId]);
        }
    }
    resumeReceivingStream(streamId) {
        if (!!this.meetingSessionContext && this.meetingSessionContext.signalingClient) {
            this.meetingSessionContext.signalingClient.resume([streamId]);
        }
    }
    getRemoteVideoSources() {
        const { videoStreamIndex } = this.meetingSessionContext;
        if (!videoStreamIndex) {
            this.logger.info('meeting has not started');
            return [];
        }
        const selfAttendeeId = this.configuration.credentials.attendeeId;
        return videoStreamIndex.allVideoSendingSourcesExcludingSelf(selfAttendeeId);
    }
    encodingSimulcastLayersDidChange(simulcastLayers) {
        this.mayNeedRenegotiationForSimulcastLayerChange = true;
        this.forEachObserver(observer => {
            Types_1.Maybe.of(observer.encodingSimulcastLayersDidChange).map(f => f.bind(observer)(simulcastLayers));
        });
    }
    promoteToPrimaryMeeting(credentials) {
        return this.actionPromoteToPrimaryMeeting(credentials);
    }
    actionPromoteToPrimaryMeeting(credentials) {
        return __awaiter(this, void 0, void 0, function* () {
            let resultingStatus = new MeetingSessionStatus_1.default(MeetingSessionStatusCode_1.default.SignalingRequestFailed);
            yield new SerialGroupTask_1.default(this.logger, this.wrapTaskName('PromoteToPrimaryMeeting'), [
                new TimeoutTask_1.default(this.logger, new PromoteToPrimaryMeetingTask_1.default(this.meetingSessionContext, credentials, (status) => {
                    resultingStatus = status;
                }), this.configuration.connectionTimeoutMs),
            ]).run();
            this.promotedToPrimaryMeeting = resultingStatus.statusCode() === MeetingSessionStatusCode_1.default.OK;
            return resultingStatus;
        });
    }
    demoteFromPrimaryMeeting() {
        this.meetingSessionContext.signalingClient.demoteFromPrimaryMeeting();
        this.forEachObserver(observer => {
            Types_1.Maybe.of(observer.audioVideoWasDemotedFromPrimaryMeeting).map(f => f.bind(observer)(new MeetingSessionStatus_1.default(MeetingSessionStatusCode_1.default.OK)));
        });
    }
    videoInputDidChange(videoStream) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('Receive a video input change event');
            // No active meeting, there is nothing to do
            if (!this.meetingSessionContext || !this.meetingSessionContext.peer) {
                this.logger.info('Skip updating video input because there is no active meeting and peer connection');
                return;
            }
            if (this._videoTileController.hasStartedLocalVideoTile()) {
                if (videoStream) {
                    yield this.replaceLocalVideo(videoStream);
                }
                else {
                    this._videoTileController.stopLocalVideoTile();
                }
            }
        });
    }
    audioInputDidChange(audioStream) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('Receive an audio input change event');
            // No active meeting, there is nothing to do
            if (!this.meetingSessionContext || !this.meetingSessionContext.peer) {
                this.logger.info('Skip updating audio input because there is no active meeting and peer connection');
                return;
            }
            if (!audioStream) {
                // If audio input stream stopped, try to get empty audio device from media stream broker
                try {
                    audioStream = yield this.mediaStreamBroker.acquireAudioInputStream();
                }
                catch (error) {
                    this.logger.error('Could not acquire audio track from mediaStreamBroker');
                    return;
                }
            }
            yield this.replaceLocalAudio(audioStream);
        });
    }
    audioOutputDidChange(device) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info('Receive an audio output change event');
            return this.audioMixController.bindAudioDevice(device);
        });
    }
}
exports.default = DefaultAudioVideoController;
DefaultAudioVideoController.MIN_VOLUME_DECIBELS = -42;
DefaultAudioVideoController.MAX_VOLUME_DECIBELS = -14;
DefaultAudioVideoController.PING_PONG_INTERVAL_MS = 10000;
//# sourceMappingURL=DefaultAudioVideoController.js.map