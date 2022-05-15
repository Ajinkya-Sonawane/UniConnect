import AudioMixObserver from '../audiomixobserver/AudioMixObserver';
import AudioVideoFacade from '../audiovideofacade/AudioVideoFacade';
import AudioNodeSubgraph from '../devicecontroller/AudioNodeSubgraph';
import type AudioTransformDevice from '../devicecontroller/AudioTransformDevice';
import type Device from '../devicecontroller/Device';
import VoiceFocusTransformDeviceObserver from './VoiceFocusTransformDeviceObserver';
/**
 * A device that augments a {@link Device} to apply Amazon Voice Focus
 * noise suppression to an audio input.
 */
declare class VoiceFocusTransformDevice implements AudioTransformDevice, AudioMixObserver {
    private device;
    private voiceFocus;
    private delegate;
    private nodeOptions;
    private failed;
    private node;
    private browserBehavior;
    /** farEndStreams` maps from a stream that could cause echo or interfere with double talkto an `AudioSourceNode` that we use to mix multiple such streams.*/
    private farEndStreamToAudioSourceNode;
    /** mixDestNode is the Audio Destination Node where farEndStreams got mixed into one stream.*/
    private mixDestNode;
    /** mixSourceNode is the Audio Source Node where the stream out of mixDestNode got transfered into Audio Worklet Node for processing.*/
    private mixSourceNode;
    /**
     * Return the inner device as provided during construction, or updated via
     * {@link VoiceFocusTransformDevice.chooseNewInnerDevice}. Do not confuse
     * this method with {@link VoiceFocusTransformDevice.intrinsicDevice}.
     */
    getInnerDevice(): Device;
    /**
     * Disable the audio node while muted to reduce CPU usage.
     *
     * @param muted whether the audio device should be muted.
     */
    mute(muted: boolean): Promise<void>;
    /**
     * Dispose of the inner workings of the transform device. After this method is called
     * you will need to create a new device to use Amazon Voice Focus again.
     */
    stop(): Promise<void>;
    /**
     * If you wish to choose a different inner device, but continue to use Amazon Voice Focus, you
     * can use this method to efficiently create a new device that will reuse
     * the same internal state. Only one of the two devices can be used at a time: switch
     * between them using {@link DeviceController.startAudioInput}.
     *
     * If the same device is passed as is currently in use, `this` is returned.
     *
     * @param inner The new inner device to use.
     */
    chooseNewInnerDevice(inner: Device): Promise<VoiceFocusTransformDevice>;
    intrinsicDevice(): Promise<Device>;
    createAudioNode(context: AudioContext): Promise<AudioNodeSubgraph>;
    observeMeetingAudio(audioVideo: AudioVideoFacade): Promise<void>;
    unObserveMeetingAudio(audioVideo: AudioVideoFacade): Promise<void>;
    /**
     * Add an observer to receive notifications about Amazon Voice Focus lifecycle events.
     * See {@link VoiceFocusTransformDeviceObserver} for details.
     * If the observer has already been added, this method call has no effect.
     */
    addObserver(observer: VoiceFocusTransformDeviceObserver): void;
    /**
     * Remove an existing observer. If the observer has not been previously {@link
     * VoiceFocusTransformDevice.addObserver|added}, this method call has no effect.
     */
    removeObserver(observer: VoiceFocusTransformDeviceObserver): void;
    addFarEndStream(activeStream: MediaStream | null): Promise<void>;
    removeFarendStream(inactiveStream: MediaStream): Promise<void>;
    meetingAudioStreamBecameActive(activeStream: MediaStream | null): Promise<void>;
    meetingAudioStreamBecameInactive(inactiveStream: MediaStream): Promise<void>;
    private assignFarEndStreamToAudioSourceNode;
    private createMixSourceNode;
}
export default VoiceFocusTransformDevice;
