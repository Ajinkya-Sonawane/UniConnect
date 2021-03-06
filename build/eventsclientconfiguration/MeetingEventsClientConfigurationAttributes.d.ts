/**
 * [[MeetingEventsClientConfigurationAttributes]] describes meeting client specific attributes
 * required in client metadata when sending to ingestion service endpoint.
 */
export default interface MeetingEventsClientConfigurationAttributes {
    meetingId?: string;
    attendeeId?: string;
    type?: string;
    v?: number;
}
