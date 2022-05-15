import AudioMixController from '../audiomixcontroller/AudioMixController';
import AudioProfile from '../audioprofile/AudioProfile';
import AudioVideoController from '../audiovideocontroller/AudioVideoController';
import ExtendedBrowserBehavior from '../browserbehavior/ExtendedBrowserBehavior';
import ConnectionMonitor from '../connectionmonitor/ConnectionMonitor';
import EventController from '../eventcontroller/EventController';
import Logger from '../logger/Logger';
import MediaStreamBroker from '../mediastreambroker/MediaStreamBroker';
import MeetingSessionConfiguration from '../meetingsession/MeetingSessionConfiguration';
import MeetingSessionTURNCredentials from '../meetingsession/MeetingSessionTURNCredentials';
import MeetingSessionVideoAvailability from '../meetingsession/MeetingSessionVideoAvailability';
import RealtimeController from '../realtimecontroller/RealtimeController';
import ReconnectController from '../reconnectcontroller/ReconnectController';
import RemovableObserver from '../removableobserver/RemovableObserver';
import SDP from '../sdp/SDP';
import SignalingClient from '../signalingclient/SignalingClient';
import { SdkIndexFrame, SdkStreamServiceType } from '../signalingprotocol/SignalingProtocol.js';
import StatsCollector from '../statscollector/StatsCollector';
import TransceiverController from '../transceivercontroller/TransceiverController';
import VideoCaptureAndEncodeParameter from '../videocaptureandencodeparameter/VideoCaptureAndEncodeParameter';
import VideoDownlinkBandwidthPolicy from '../videodownlinkbandwidthpolicy/VideoDownlinkBandwidthPolicy';
import VideoStreamIdSet from '../videostreamidset/VideoStreamIdSet';
import VideoStreamIndex from '../videostreamindex/VideoStreamIndex';
import VideoTileController from '../videotilecontroller/VideoTileController';
import VideoUplinkBandwidthPolicy from '../videouplinkbandwidthpolicy/VideoUplinkBandwidthPolicy';
import VolumeIndicatorAdapter from '../volumeindicatoradapter/VolumeIndicatorAdapter';
/**
 * [[AudioVideoControllerState]] includes the compute resources shared by [[Task]].
 */
export default class AudioVideoControllerState {
    logger: Logger | null;
    browserBehavior: ExtendedBrowserBehavior | null;
    signalingClient: SignalingClient | null;
    meetingSessionConfiguration: MeetingSessionConfiguration | null;
    peer: RTCPeerConnection | null;
    previousSdpOffer: SDP | null;
    sdpOfferInit: RTCSessionDescriptionInit | null;
    audioVideoController: AudioVideoController | null;
    realtimeController: RealtimeController | null;
    videoTileController: VideoTileController | null;
    mediaStreamBroker: MediaStreamBroker | null;
    audioMixController: AudioMixController | null;
    activeAudioInput: MediaStream | undefined;
    activeVideoInput: MediaStream | undefined;
    transceiverController: TransceiverController | null;
    indexFrame: SdkIndexFrame | null;
    iceCandidates: RTCIceCandidate[];
    iceCandidateHandler: ((event: RTCPeerConnectionIceEvent) => void) | null;
    iceGatheringStateEventHandler: (() => void) | null;
    sdpAnswer: string | null;
    turnCredentials: MeetingSessionTURNCredentials | null;
    reconnectController: ReconnectController | null;
    removableObservers: RemovableObserver[];
    audioProfile: AudioProfile | null;
    videoStreamIndex: VideoStreamIndex | null;
    videoDownlinkBandwidthPolicy: VideoDownlinkBandwidthPolicy | null;
    videoUplinkBandwidthPolicy: VideoUplinkBandwidthPolicy | null;
    lastKnownVideoAvailability: MeetingSessionVideoAvailability | null;
    videoCaptureAndEncodeParameter: VideoCaptureAndEncodeParameter | null;
    videosToReceive: VideoStreamIdSet | null;
    lastVideosToReceive: VideoStreamIdSet | null;
    videoSubscriptions: number[] | null;
    videoSubscriptionLimit: number;
    previousSdpAnswerAsString: string;
    serverSupportsCompression: boolean;
    videosPaused: VideoStreamIdSet | null;
    videoDuplexMode: SdkStreamServiceType | null;
    volumeIndicatorAdapter: VolumeIndicatorAdapter | null;
    statsCollector: StatsCollector | null;
    connectionMonitor: ConnectionMonitor | null;
    videoInputAttachedTimestampMs: number;
    audioDeviceInformation: {
        [id: string]: string;
    };
    videoDeviceInformation: {
        [id: string]: string;
    };
    enableSimulcast: boolean;
    eventController: EventController | null;
    signalingOpenDurationMs: number | null;
    iceGatheringDurationMs: number | null;
    startAudioVideoTimestamp: number | null;
    attendeePresenceDurationMs: number | null;
    meetingStartDurationMs: number | null;
    poorConnectionCount: number;
    maxVideoTileCount: number;
    startTimeMs: number | null;
}
