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
            return;
        }

        if (!apiService.getDeviceId(apiService.username)) {
            this.router.navigateByUrl('html/register-device.html');
            return;
        }

        console.log('Sending login command');
        chrome.runtime.sendMessage(
            null,
            {
                'cmd': 'ownpass-logged-in'
            }
        );
    }

    onLogout = () => {
        this.oAuthService.removeToken();

        console.log('Sending logout command');
        chrome.runtime.sendMessage(
            null,
            {
                'cmd': 'ownpass-logged-out'
            }
        );

        this.router.navigateByUrl('html/login.html');
    }
}

