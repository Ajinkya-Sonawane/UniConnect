import ApplicationMetadata from '../applicationmetadata/ApplicationMetadata';
/**
 * [[SignalingClientJoin]] contains settings for the Join SignalFrame.
 */
export default class SignalingClientJoin {
    readonly applicationMetadata?: ApplicationMetadata;
    /** Initializes a SignalingClientJoin with the given properties.
     * @param applicationMetadata [[ApplicationMetadata]].
     */
    constructor(applicationMetadata?: ApplicationMetadata);
}
