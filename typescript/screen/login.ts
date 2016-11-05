import {Component} from "@angular/core";
import {Credentials} from "../interfaces/credentials";
import {FormGroup, FormControl} from "@angular/forms";
import {OAuthService} from "../service/oauth";
import {Router} from "@angular/router";
import {ConfigService} from "../service/config";
import {ApiService} from "../service/api";
import {LocalStorageService} from "../service/localstorage";

@Component({
    selector: 'ownpass-screen-login',
    templateUrl: 'login.html'
})

export class LoginScreen {
    public submitted: boolean;
    public status: string;
    public loginForm: FormGroup;

    constructor(private router: Router,
                private apiService: ApiService,
                private configService: ConfigService,
                private oAuthService: OAuthService,
                private localStorageService: LocalStorageService) {
        let serverControl = new FormControl();
        serverControl.setValue(localStorageService.get('login-screen-server'));

        let usernameControl = new FormControl();
        usernameControl.setValue(localStorageService.get('login-screen-username'));

        this.loginForm = new FormGroup({
            server: serverControl,
            username: new FormControl(this.apiService.username),
            password: new FormControl('')
        });
    }

    onSubmit = (submitEvent: Event, model: Credentials) => {
        let that = this;

        this.status = null;
        this.submitted = true;

        if (!this.loginForm.valid) {
            this.status = 'The form is not valid.';
            return;
        }

        this.configService.serverUrl = model.server.replace(/\/$/, '');

        this.localStorageService.set('login-screen-server', this.configService.serverUrl);
        this.localStorageService.set('login-screen-username', model.username);

        this.oAuthService.login(model.username, model.password).subscribe(
            response => {
                that.apiService.username = model.username;
                that.oAuthService.setToken(response['_body']);

                if (!this.apiService.getDeviceId(this.apiService.username)) {
                    this.router.navigateByUrl('html/register-device.html');
                } else {
                    this.router.navigateByUrl('html/popup.html');
                }
            },
            error => {
                this.status = error.json().error_description;
            }
        );
    }
}

