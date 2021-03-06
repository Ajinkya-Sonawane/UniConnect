"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * [[MeetingSessionURLs]] contains the URLs that will be used to reach the
 * meeting service.
 */
class MeetingSessionURLs {
    constructor() {
        /**
         * The audio host URL of the session
         */
        this._audioHostURL = null;
        /**
         * The signaling URL of the session
         */
        this._signalingURL = null;
        /**
         * The TURN control URL of the session
         */
        this._turnControlURL = null;
        /**
         * The event ingestion URL to send the meeting events.
         */
        this._eventIngestionURL = null;
        /**
         * Function to transform URLs. Use this to rewrite URLs to traverse proxies.
         * The default implementation returns the original URL unchanged.
         */
        this.urlRewriter = (url) => {
            return url;
        };
    }
    /**
     * Gets or sets the audio host URL with gets reflecting the result of the {@link MeetingSessionURLs.urlRewriter} function.
     */
    get audioHostURL() {
        return this.urlRewriter(this._audioHostURL);
    }
    set audioHostURL(value) {
        this._audioHostURL = value;
    }
    /**
     * Gets or sets the signaling URL with gets reflecting the result of the {@link MeetingSessionURLs.urlRewriter} function.
     */
    get signalingURL() {
        return this.urlRewriter(this._signalingURL);
    }
    set signalingURL(value) {
        this._signalingURL = value;
    }
    /**
     * Gets or sets the TURN control URL with gets reflecting the result of the {@link MeetingSessionURLs.urlRewriter} function.
     */
    get turnControlURL() {
        return this.urlRewriter(this._turnControlURL);
    }
    set turnControlURL(value) {
        this._turnControlURL = value;
    }
    /**
     * Gets or sets the events ingestion URL with gets reflecting the result of the {@link MeetingSessionURLs.urlRewriter} function.
     */
    get eventIngestionURL() {
        return this.urlRewriter(this._eventIngestionURL);
    }
    set eventIngestionURL(value) {
        this._eventIngestionURL = value;
    }
}
exports.default = MeetingSessionURLs;
//# sourceMappingURL=MeetingSessionURLs.js.map