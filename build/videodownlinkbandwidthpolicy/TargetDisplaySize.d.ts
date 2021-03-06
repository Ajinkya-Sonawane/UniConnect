/**
 * [[TargetDisplaySize]] represents the max resolution that a video stream can have when simulcast is enabled in priority based downlink policy.
 * If there is only one stream being sent, then this field will get ignored.  Its values currently parallel [[SimulcastLayers]].
 */
export declare enum TargetDisplaySize {
    /**
     * Low resolution video stream.
     */
    Low = 0,
    /**
     * Medium resolution video stream.
     */
    Medium = 1,
    /**
     * High resolution video stream.
     */
    High = 2
}
export default TargetDisplaySize;
