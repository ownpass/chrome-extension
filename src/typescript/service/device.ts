import {ConfigService} from "./config";
import {Injectable} from "@angular/core";
import {LocalStorageToken} from "../interfaces/localstorage-token";
import {Http, Headers} from "@angular/http";
import {OAuthService} from "./oauth";
import {Observable} from 'rxjs/Rx';
import {Router} from "@angular/router";

@Injectable()
export class DeviceService {
    constructor(private config: ConfigService,
                private http: Http,
                private oAuth: OAuthService,
                private router: Router) {
    }

    activate = (code: string) => {
        let token: LocalStorageToken = this.oAuth.getToken();

        if (token.access_token === '') {
            this.router.navigateByUrl('login');

            return Observable.of({});
        }

        let headers = new Headers();
        headers.append('Authorization', token.token_type + ' ' + token.access_token);
        headers.append('Content-Type', 'application/json');

        return this.http.post(this.config.serverUrl + '/device/activate', JSON.stringify({
            'code': code
        }), {
            headers: headers,
        }).map(response => response.json());
    }

    create = (name: string, description: string) => {
        let token: LocalStorageToken = this.oAuth.getToken();

        console.log(token);

        let headers = new Headers();
        headers.append('Authorization', token.token_type + ' ' + token.access_token);
        headers.append('Content-Type', 'application/json');

        return this.http.post(this.config.serverUrl + '/device', JSON.stringify({
            'name': name,
            'description': description
        }), {
            headers: headers,
        }).map(response => response.json());
    }
}
