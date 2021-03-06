import AudioVideoEventAttributes from './AudioVideoEventAttributes';
import DeviceEventAttributes from './DeviceEventAttributes';
/**
 *
 * @param attributes Event attributes to flatten.
 * @returns flattened event attributes.
 * Note: This function needs to be extended to support 'Array', 'object'
 * as value types within the event attributes if added later.
 */
declare const flattenEventAttributes: (attributes: AudioVideoEventAttributes | DeviceEventAttributes) => {
    [key: string]: string | number;
};
export default flattenEventAttributes;
