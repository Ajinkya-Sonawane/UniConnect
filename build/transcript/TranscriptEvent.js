"use strict";
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranscriptEventConverter = void 0;
const SignalingProtocol_1 = require("../signalingprotocol/SignalingProtocol");
const Transcript_1 = require("./Transcript");
const TranscriptionStatus_1 = require("./TranscriptionStatus");
const TranscriptionStatusType_1 = require("./TranscriptionStatusType");
const TranscriptItemType_1 = require("./TranscriptItemType");
const TranscriptionStatusTypes = {
    [SignalingProtocol_1.SdkTranscriptionStatus.Type.STARTED]: TranscriptionStatusType_1.default.STARTED,
    [SignalingProtocol_1.SdkTranscriptionStatus.Type.INTERRUPTED]: TranscriptionStatusType_1.default.INTERRUPTED,
    [SignalingProtocol_1.SdkTranscriptionStatus.Type.RESUMED]: TranscriptionStatusType_1.default.RESUMED,
    [SignalingProtocol_1.SdkTranscriptionStatus.Type.STOPPED]: TranscriptionStatusType_1.default.STOPPED,
    [SignalingProtocol_1.SdkTranscriptionStatus.Type.FAILED]: TranscriptionStatusType_1.default.FAILED,
};
class TranscriptEventConverter {
    /**
     * Decodes a list of TranscriptEvent from a data message.
     * @param dataMessage Data message to decode from
     * @returns List of TranscriptEvent
     * @throws {Error} If the data message payload cannot be decoded
     */
    static from(dataMessage) {
        let frame;
        try {
            frame = SignalingProtocol_1.SdkTranscriptFrame.decode(dataMessage.data);
        }
        catch (e) {
            throw new Error('Cannot decode transcript data message: ' + e);
        }
        const transcriptEvents = [];
        for (const sdkTranscriptEvent of frame.events) {
            if (sdkTranscriptEvent.status) {
                const transcriptionStatusType = TranscriptionStatusTypes[sdkTranscriptEvent.status.type];
                if (!transcriptionStatusType) {
                    continue;
                }
                const transcriptionStatus = new TranscriptionStatus_1.default();
                transcriptionStatus.type = transcriptionStatusType;
                transcriptionStatus.eventTimeMs = sdkTranscriptEvent.status.eventTime;
                transcriptionStatus.transcriptionRegion = sdkTranscriptEvent.status.transcriptionRegion;
                transcriptionStatus.transcriptionConfiguration =
                    sdkTranscriptEvent.status.transcriptionConfiguration;
                if (sdkTranscriptEvent.status.message) {
                    transcriptionStatus.message = sdkTranscriptEvent.status.message;
                }
                transcriptEvents.push(transcriptionStatus);
            }
            else if (sdkTranscriptEvent.transcript) {
                const transcript = new Transcript_1.default();
                transcript.results = [];
                for (const result of sdkTranscriptEvent.transcript.results) {
                    const transcriptResult = {
                        channelId: result.channelId,
                        isPartial: result.isPartial,
                        resultId: result.resultId,
                        startTimeMs: result.startTime,
                        endTimeMs: result.endTime,
                        alternatives: [],
                    };
                    if (result.languageCode) {
                        transcriptResult.languageCode = result.languageCode;
                    }
                    if (result.languageIdentification && result.languageIdentification.length > 0) {
                        transcriptResult.languageIdentification = [];
                        for (const languageIdentification of result.languageIdentification) {
                            const transcriptLanguageWithScore = {
                                languageCode: languageIdentification.languageCode,
                                score: languageIdentification.score,
                            };
                            transcriptResult.languageIdentification.push(transcriptLanguageWithScore);
                        }
                    }
                    for (const alternative of result.alternatives) {
                        const transcriptAlternative = {
                            items: [],
                            transcript: alternative.transcript,
                        };
                        for (const item of alternative.items) {
                            const transcriptItem = {
                                content: item.content,
                                attendee: {
                                    attendeeId: item.speakerAttendeeId,
                                    externalUserId: item.speakerExternalUserId,
                                },
                                startTimeMs: item.startTime,
                                endTimeMs: item.endTime,
                                type: null,
                            };
                            if (item.vocabularyFilterMatch) {
                                transcriptItem.vocabularyFilterMatch = item.vocabularyFilterMatch;
                            }
                            if (item.hasOwnProperty('stable')) {
                                transcriptItem.stable = item.stable;
                            }
                            if (item.hasOwnProperty('confidence')) {
                                transcriptItem.confidence = item.confidence;
                            }
                            switch (item.type) {
                                case SignalingProtocol_1.SdkTranscriptItem.Type.PRONUNCIATION:
                                    transcriptItem.type = TranscriptItemType_1.default.PRONUNCIATION;
                                    break;
                                case SignalingProtocol_1.SdkTranscriptItem.Type.PUNCTUATION:
                                    transcriptItem.type = TranscriptItemType_1.default.PUNCTUATION;
                                    break;
                            }
                            transcriptAlternative.items.push(transcriptItem);
                        }
                        for (const entity of alternative.entities) {
                            if (!transcriptAlternative.entities) {
                                transcriptAlternative.entities = [];
                            }
                            const transcriptEntity = {
                                category: entity.category,
                                confidence: entity.confidence,
                                content: entity.content,
                                startTimeMs: entity.startTime,
                                endTimeMs: entity.endTime,
                            };
                            if (entity.type) {
                                transcriptEntity.type = entity.type;
                            }
                            transcriptAlternative.entities.push(transcriptEntity);
                        }
                        transcriptResult.alternatives.push(transcriptAlternative);
                    }
                    transcript.results.push(transcriptResult);
                }
                transcriptEvents.push(transcript);
            }
        }
        return transcriptEvents;
    }
}
exports.TranscriptEventConverter = TranscriptEventConverter;
//# sourceMappingURL=TranscriptEvent.js.map