import {ConfigService} from "./config";
import {Http, Headers} from '@angular/http';
import {Injectable} from "@angular/core";
import {LocalStorageToken} from "../interfaces/localstorage-token";
import {LocalStorageService} from "./localstorage";
import {OAuthService} from "./oauth";
import {Observable} from "rxjs/Observable";
import {Router} from "@angular/router";
import 'rxjs/add/observable/of';

@Injectable()
export class ApiService {
    private _username: string;

    constructor(private config: ConfigService,
                private http: Http,
                private oAuth: OAuthService,
                private router: Router,
                private localStorage: LocalStorageService) {
        this._username = this.localStorage.get('current-user');
    }

    get username(): string {
        return this._username;
    }

    set username(value: string) {
        this.localStorage.set('current-user', value);

        this._username = value;
    }

    getDeviceId(username: string): string {
        let data = this.localStorage.getJSON('device-ids');

        if (!data) {
            return null;
        }

        if (!data[username]) {
            return null;
        }

        return data[username];
    }

    setDeviceId(username: string, id: string): void {
        let data = this.localStorage.getJSON('device-ids');

        if (!data) {
            data = {};
        }

        data[username] = id;

        this.localStorage.setJSON('device-ids', data);
    }

    buildHeaders(token: LocalStorageToken): Headers {
        let headers = new Headers();
        headers.append('Authorization', token.token_type + ' ' + token.access_token);
        headers.append('Content-Type', 'application/json');

        let deviceId = this.getDeviceId(this._username);

        if (deviceId) {
            headers.append('X-OwnPass-Device', deviceId);
        }

        return headers;
    }

    delete(path: string): any {
        let token: LocalStorageToken = this.oAuth.getToken();

        if (token.access_token === '') {
            this.router.navigateByUrl('login');

            return Observable.of({});
        }

        let headers = this.buildHeaders(token);

        return this.http.delete(this.config.serverUrl + path, {
            headers: headers
        });
    }

    get(path: string): any {
        let token: LocalStorageToken = this.oAuth.getToken();

        if (token.access_token === '') {
            this.router.navigateByUrl('login');

            return Observable.of({});
        }

        let headers = this.buildHeaders(token);

        return this.http.get(this.config.serverUrl + path, {
            headers: headers
        });
    }

    post(path: string, params: any): any {
        let token: LocalStorageToken = this.oAuth.getToken();

        if (token.access_token === '') {
            this.router.navigateByUrl('login');

            return Observable.of({});
        }

        let headers = this.buildHeaders(token);

        return this.http.post(this.config.serverUrl + path, JSON.stringify(params), {
            headers: headers
        });
    }

    put(path: string, params: any): any {
        let token: LocalStorageToken = this.oAuth.getToken();

        if (token.access_token === '') {
            this.router.navigateByUrl('login');

            return Observable.of({});
        }

        let headers = this.buildHeaders(token);

        return this.http.put(this.config.serverUrl + path, JSON.stringify(params), {
            headers: headers
        });
    }
}
