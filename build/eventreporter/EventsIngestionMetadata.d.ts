import MeetingEventsClientConfigurationAttributes from '../eventsclientconfiguration/MeetingEventsClientConfigurationAttributes';
/**
 * [[EventsIngestionMetadata]] contains the necessary metadata information
 * to be sent with events to the ingestion service.
 */
export default interface EventsIngestionMetadata extends MeetingEventsClientConfigurationAttributes {
    sdkVersion?: string;
    sdkName?: string;
    osName?: string;
    osVersion?: string;
    browserName?: string;
    browserVersion?: string;
    deviceName?: string;
}
