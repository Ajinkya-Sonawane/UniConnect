import './styleV2.scss';
import { Attendee, AudioInputDevice, AudioVideoFacade, AudioVideoObserver, BackgroundBlurProcessor, BackgroundBlurVideoFrameProcessorObserver, BackgroundReplacementProcessor, BackgroundReplacementVideoFrameProcessorObserver, BackgroundReplacementOptions, ClientMetricReport, ContentShareObserver, DataMessage, DefaultBrowserBehavior, DefaultDeviceController, DefaultVideoTransformDevice, DeviceChangeObserver, EventAttributes, EventName, EventReporter, LogLevel, Logger, MeetingSession, MeetingSessionConfiguration, MeetingSessionStatus, MeetingSessionVideoAvailability, RemovableAnalyserNode, SimulcastLayers, TranscriptEvent, TranscriptionStatus, TranscriptResult, VideoDownlinkObserver, VideoPriorityBasedPolicy, VideoPriorityBasedPolicyConfig, VoiceFocusDeviceTransformer, VoiceFocusTransformDevice, MeetingSessionCredentials, POSTLogger } from 'amazon-chime-sdk-js';
import VideoTileCollection from './video/VideoTileCollection';
import VideoPreferenceManager from './video/VideoPreferenceManager';
export declare let fatal: (e: Error) => void;
declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}
declare type VideoFilterName = 'Emojify' | 'CircularCut' | 'NoOp' | 'Segmentation' | 'Resize (9/16)' | 'Background Blur 10% CPU' | 'Background Blur 20% CPU' | 'Background Blur 30% CPU' | 'Background Blur 40% CPU' | 'Background Replacement' | 'None';
declare type ButtonState = 'on' | 'off' | 'disabled';
export declare enum ContentShareType {
    ScreenCapture = 0,
    VideoFile = 1
}
interface Toggle {
    name: string;
    oncreate: (elem: HTMLElement) => void;
    action: () => void;
}
interface TranscriptSegment {
    contentSpan: HTMLSpanElement;
    attendee: Attendee;
    startTimeMs: number;
    endTimeMs: number;
}
export declare class DemoMeetingApp implements AudioVideoObserver, DeviceChangeObserver, ContentShareObserver, VideoDownlinkObserver {
    static readonly DID: string;
    static readonly BASE_URL: string;
    static testVideo: string;
    static readonly MAX_MEETING_HISTORY_MS: number;
    static readonly DATA_MESSAGE_TOPIC: string;
    static readonly DATA_MESSAGE_LIFETIME_MS: number;
    static readonly REMOTE_VIDEO_PAGE_SIZE: number;
    static readonly REDUCED_REMOTE_VIDEO_PAGE_SIZE: number;
    loadingBodyPixDependencyTimeoutMs: number;
    loadingBodyPixDependencyPromise: undefined | Promise<void>;
    attendeeIdPresenceHandler: (undefined | ((attendeeId: string, present: boolean, externalUserId: string, dropped: boolean) => void));
    activeSpeakerHandler: (undefined | ((attendeeIds: string[]) => void));
    blurObserver: (undefined | BackgroundBlurVideoFrameProcessorObserver);
    replacementObserver: (undefined | BackgroundReplacementVideoFrameProcessorObserver);
    showActiveSpeakerScores: boolean;
    meeting: string | null;
    name: string | null;
    voiceConnectorId: string | null;
    sipURI: string | null;
    region: string | null;
    primaryExternalMeetingId: string | undefined;
    primaryMeetingSessionCredentials: MeetingSessionCredentials | undefined;
    meetingSession: MeetingSession | null;
    priorityBasedDownlinkPolicy: VideoPriorityBasedPolicy | null;
    audioVideo: AudioVideoFacade | null;
    deviceController: DefaultDeviceController | undefined;
    canStartLocalVideo: boolean;
    defaultBrowserBehavior: DefaultBrowserBehavior;
    videoTileCollection: VideoTileCollection | undefined;
    videoPreferenceManager: VideoPreferenceManager | undefined;
    roster: any;
    cameraDeviceIds: string[];
    microphoneDeviceIds: string[];
    currentAudioInputDevice: AudioInputDevice | undefined;
    buttonStates: {
        [key: string]: ButtonState;
    };
    contentShareType: ContentShareType;
    isViewOnly: boolean;
    enableWebAudio: boolean;
    logLevel: LogLevel;
    enableSimulcast: boolean;
    usePriorityBasedDownlinkPolicy: boolean;
    videoPriorityBasedPolicyConfig: VideoPriorityBasedPolicyConfig;
    enablePin: boolean;
    echoReductionCapability: boolean;
    usingStereoMusicAudioProfile: boolean;
    supportsVoiceFocus: boolean;
    enableVoiceFocus: boolean;
    voiceFocusIsActive: boolean;
    supportsBackgroundBlur: boolean;
    supportsBackgroundReplacement: boolean;
    enableLiveTranscription: boolean;
    noWordSeparatorForTranscription: boolean;
    markdown: any;
    lastMessageSender: string | null;
    lastReceivedMessageTimestamp: number;
    lastPacketsSent: number;
    meetingSessionPOSTLogger: POSTLogger;
    meetingEventPOSTLogger: POSTLogger;
    hasChromiumWebRTC: boolean;
    voiceFocusTransformer: VoiceFocusDeviceTransformer | undefined;
    voiceFocusDevice: VoiceFocusTransformDevice | undefined;
    joinInfo: any | undefined;
    deleteOwnAttendeeToLeave: boolean;
    blurProcessor: BackgroundBlurProcessor | undefined;
    replacementProcessor: BackgroundReplacementProcessor | undefined;
    replacementOptions: BackgroundReplacementOptions | undefined;
    voiceFocusDisplayables: HTMLElement[];
    analyserNode: RemovableAnalyserNode;
    liveTranscriptionDisplayables: HTMLElement[];
    chosenVideoTransformDevice: DefaultVideoTransformDevice;
    chosenVideoFilter: VideoFilterName;
    selectedVideoFilterItem: VideoFilterName;
    meetingLogger: Logger | undefined;
    behaviorAfterLeave: 'spa' | 'reload' | 'halt';
    videoMetricReport: {
        [id: string]: {
            [id: string]: {};
        };
    };
    removeFatalHandlers: () => void;
    transcriptContainerDiv: HTMLDivElement;
    partialTranscriptDiv: HTMLDivElement | undefined;
    partialTranscriptResultTimeMap: Map<string, number>;
    partialTranscriptResultMap: Map<string, TranscriptResult>;
    transcriptEntitySet: Set<string>;
    addFatalHandlers(): void;
    eventReporter: EventReporter | undefined;
    enableEventReporting: boolean;
    constructor();
    /**
     * We want to make it abundantly clear at development and testing time
     * when an unexpected error occurs.
     * If we're running locally, or we passed a `fatal=1` query parameter, fail hard.
     */
    fatal(e: Error | string): void;
    initParameters(): void;
    initVoiceFocus(): Promise<void>;
    initBackgroundBlur(): Promise<void>;
    createReplacementImageBlob(startColor: string, endColor: string): Promise<Blob>;
    /**
    * The image blob in this demo is created by generating an image
    * from a canvas, but another common scenario would be to provide
    * an image blob from fetching a URL.
    *   const image = await fetch('https://someimage.jpeg');
    *   const imageBlob = await image.blob();
    */
    getBackgroundReplacementOptions(): Promise<BackgroundReplacementOptions>;
    initBackgroundReplacement(): Promise<void>;
    initEventListeners(): void;
    logAudioStreamPPS(clientMetricReport: ClientMetricReport): void;
    getNearestMediaRegion(): Promise<string>;
    promoteToPrimaryMeeting(): Promise<void>;
    private getPrimaryMeetingCredentials;
    updateUXForViewOnlyMode(): void;
    updateUXForReplicaMeetingPromotionState(promotedState: 'promoted' | 'demoted'): void;
    setButtonVisibility(button: string, visible: boolean, state?: ButtonState): void;
    toggleButton(button: string, state?: ButtonState): ButtonState;
    isButtonOn(button: string): boolean;
    displayButtonStates(): void;
    showProgress(id: string): void;
    hideProgress(id: string): void;
    switchToFlow(flow: string): void;
    onAudioInputsChanged(freshDevices: MediaDeviceInfo[]): Promise<void>;
    audioInputMuteStateChanged(device: string | MediaStream, muted: boolean): void;
    audioInputsChanged(freshAudioInputDeviceList: MediaDeviceInfo[]): void;
    videoInputsChanged(_freshVideoInputDeviceList: MediaDeviceInfo[]): void;
    audioOutputsChanged(_freshAudioOutputDeviceList: MediaDeviceInfo[]): void;
    audioInputStreamEnded(deviceId: string): void;
    videoInputStreamEnded(deviceId: string): void;
    metricsDidReceive(clientMetricReport: ClientMetricReport): void;
    displayEstimatedUplinkBandwidth(bitrate: number): void;
    displayEstimatedDownlinkBandwidth(bitrate: number): void;
    resetStats: () => void;
    getRelayProtocol(): Promise<void>;
    createLogStream(configuration: MeetingSessionConfiguration, pathname: string): Promise<void>;
    eventDidReceive(name: EventName, attributes: EventAttributes): void;
    initializeMeetingSession(configuration: MeetingSessionConfiguration): Promise<void>;
    setupEventReporter(configuration: MeetingSessionConfiguration): Promise<EventReporter>;
    private isLocalHost;
    join(): Promise<void>;
    leave(): Promise<void>;
    setupMuteHandler(): void;
    setupCanUnmuteHandler(): void;
    updateRoster(): void;
    updateProperty(obj: any, key: string, value: string): void;
    setupSubscribeToAttendeeIdPresenceHandler(): void;
    dataMessageHandler(dataMessage: DataMessage): void;
    setupDataMessage(): void;
    transcriptEventHandler: (transcriptEvent: TranscriptEvent) => void;
    renderPartialTranscriptResults: () => void;
    updatePartialTranscriptDiv: () => void;
    populatePartialTranscriptSegmentsFromResult: (segments: TranscriptSegment[], result: TranscriptResult) => void;
    createSpaceSpan(): HTMLSpanElement;
    appendNewSpeakerTranscriptDiv: (segment: TranscriptSegment, speakerToTranscriptSpanMap: Map<string, HTMLSpanElement>) => void;
    appendStatusDiv: (status: TranscriptionStatus) => void;
    setupLiveTranscription: () => void;
    sendJoinRequest(meeting: string, name: string, region: string, primaryExternalMeetingId?: string): Promise<any>;
    deleteAttendee(meeting: string, attendeeId: string): Promise<void>;
    startMediaCapture(): Promise<any>;
    stopMediaCapture(): Promise<any>;
    endMeeting(): Promise<any>;
    getAttendee(attendeeId: string): Promise<any>;
    setupDeviceLabelTrigger(): void;
    populateDeviceList(elementId: string, genericName: string, devices: MediaDeviceInfo[], additionalOptions: string[]): void;
    populateVideoPreviewFilterList(elementId: string, genericName: string, filters: VideoFilterName[]): void;
    populateInMeetingDeviceList(elementId: string, genericName: string, devices: MediaDeviceInfo[], additionalOptions: string[], additionalToggles: Toggle[] | undefined, callback: (name: string) => void): void;
    createDropdownMenuItem(menu: HTMLDivElement, title: string, clickHandler: () => void, id?: string): HTMLButtonElement;
    populateAllDeviceLists(): Promise<void>;
    private stopVideoProcessor;
    private getBackgroundBlurSpec;
    private populateVideoFilterInputList;
    private populateFilterList;
    populateAudioInputList(): Promise<void>;
    private areVideoFiltersSupported;
    private isVoiceFocusActive;
    private updateVoiceFocusDisplayState;
    private isVoiceFocusEnabled;
    private reselectAudioInputDevice;
    private toggleVoiceFocusInMeeting;
    private updateLiveTranscriptionDisplayState;
    private toggleLiveTranscription;
    populateVideoInputList(): Promise<void>;
    populateAudioOutputList(): Promise<void>;
    private chooseAudioOutput;
    selectedAudioInput(): Promise<AudioInputDevice>;
    selectAudioInputDevice(device: AudioInputDevice): Promise<void>;
    selectAudioInputDeviceByName(name: string): Promise<void>;
    openAudioInputFromSelection(): Promise<void>;
    openAudioInputFromSelectionAndPreview(): Promise<void>;
    stopAudioPreview(): Promise<void>;
    openAudioOutputFromSelection(): Promise<void>;
    private selectedVideoInput;
    openVideoInputFromSelection(selection: string | null, showPreview: boolean): Promise<void>;
    private audioInputSelectionToIntrinsicDevice;
    /**
     * Generate a stereo tone by using 2 OsciallatorNode's that
     * produce 2 different frequencies. The output of these 2
     * nodes is passed through a ChannelMergerNode to obtain
     * an audio stream with stereo channels where the left channel
     * contains the samples genrated by oscillatorNodeLeft and the
     * right channel contains samples generated by oscillatorNodeRight.
     */
    private synthesizeStereoTones;
    private streamAudioFile;
    private getVoiceFocusDeviceTransformer;
    private createVoiceFocusDevice;
    private audioInputSelectionWithOptionalVoiceFocus;
    private audioInputSelectionToDevice;
    private videoInputSelectionToIntrinsicDevice;
    private videoFilterToProcessor;
    private videoInputSelectionWithOptionalFilter;
    private videoInputSelectionToDevice;
    private playToStream;
    private contentShareStart;
    private contentShareStop;
    private updateContentShareDropdown;
    isRecorder(): boolean;
    isBroadcaster(): boolean;
    isAbortingOnReconnect(): boolean;
    authenticate(): Promise<string>;
    log(str: string, ...args: any[]): void;
    audioVideoDidStartConnecting(reconnecting: boolean): void;
    audioVideoDidStart(): void;
    audioVideoDidStop(sessionStatus: MeetingSessionStatus): void;
    audioVideoWasDemotedFromPrimaryMeeting(status: any): void;
    videoAvailabilityDidChange(availability: MeetingSessionVideoAvailability): void;
    private enableLocalVideoButton;
    allowMaxContentShare(): boolean;
    connectionDidBecomePoor(): void;
    connectionDidSuggestStopVideo(): void;
    connectionDidBecomeGood(): void;
    videoSendDidBecomeUnavailable(): void;
    contentShareDidStart(): void;
    contentShareDidStop(): void;
    contentShareDidPause(): void;
    contentShareDidUnpause(): void;
    encodingSimulcastLayersDidChange(simulcastLayers: SimulcastLayers): void;
    tileWillBePausedByDownlinkPolicy(tileId: number): void;
    tileWillBeUnpausedByDownlinkPolicy(tileId: number): void;
}
export {};
