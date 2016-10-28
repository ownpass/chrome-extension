import {Injectable} from "@angular/core";

@Injectable()
export class ConfigService {
    /**
     * The client id used to communicate with the API.
     *
     * @type {string}
     */
    private _clientId: string;

    /**
     * The name of this device.
     *
     * @type {string}
     */
    private _deviceName: string;

    /**
     * The description of this device.
     *
     * @type {string}
     */
    private _deviceDescription: string;

    /**
     * The server url used to do requests to.
     *
     * @type {string}
     */
    private _serverUrl: string;

    /**
     * Initializes a new instance of this class.
     */
    constructor() {
        this._clientId = 'chrome-extension';
    }

    get clientId(): string {
        return this._clientId;
    }

    get serverUrl(): string {
        return this._serverUrl;
    }

    set serverUrl(value: string) {
        this._serverUrl = value;
    }

    get deviceName(): string {
        return this._deviceName;
    }

    set deviceName(value: string) {
        this._deviceName = value;
    }

    get deviceDescription(): string {
        return this._deviceDescription;
    }

    set deviceDescription(value: string) {
        this._deviceDescription = value;
    }
}
