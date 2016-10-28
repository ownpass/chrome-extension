import {Component} from '@angular/core';
import {Router} from "@angular/router";
import {OAuthService} from "../service/oauth";
import {ApiService} from "../service/api";
import {FormGroup} from "@angular/forms";

@Component({
    selector: 'ownpass-screen-popup',
    templateUrl: 'dashboard.html'
})

export class PopupScreen {
    constructor(private router: Router,
                private apiService: ApiService,
                private oAuthService: OAuthService) {

        if (!this.oAuthService.hasToken()) {
            this.router.navigateByUrl('html/login.html');
        }

        if (!apiService.getDeviceId(apiService.username)) {
            this.router.navigateByUrl('html/register-device.html');
        }
    }

    onLogout = () => {
        this.oAuthService.removeToken();

        this.router.navigateByUrl('html/login.html');
    }
}

