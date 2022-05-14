import '../../style.scss';
import 'bootstrap';
import { Logger, Message, MessagingSessionObserver, MessagingSession, MessagingSessionConfiguration } from 'amazon-chime-sdk-js';
export declare class DemoMessagingSessionApp implements MessagingSessionObserver {
    static readonly BASE_URL: string;
    userArn: string;
    logger: Logger;
    configuration: MessagingSessionConfiguration;
    session: MessagingSession;
    sessionId: string;
    constructor();
    initParameters(): void;
    initEventListeners(): void;
    messagingSessionDidStart(): void;
    messagingSessionDidStartConnecting(reconnecting: boolean): void;
    messagingSessionDidStop(event: CloseEvent): void;
    messagingSessionDidReceiveMessage(message: Message): void;
    appendMessage(headingTitle: string, content: string): void;
    switchToFlow(flow: string): void;
    clearMessages(): void;
    fetchCredentials(): Promise<any>;
    updateProperty(obj: any, key: string, value: string): void;
}
