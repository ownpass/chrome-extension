import {AppComponent} from "./app";
import {AppRoutingProvider, Routing} from "./app.routing";
import {APP_BASE_HREF} from "@angular/common";
import {BrowserModule} from "@angular/platform-browser";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {HttpModule} from "@angular/http";
import {NgModule} from "@angular/core";
import {OptionsScreen} from "../screen/options";
import {PopupScreen} from "../screen/popup";
import {LoginScreen} from "../screen/login";
import {ApiService} from "../service/api";
import {ConfigService} from "../service/config";
import {DeviceService} from "../service/device";
import {OAuthService} from "../service/oauth";
import {LocalStorageService} from "../service/localstorage";
import {UserService} from "../service/user";
import {RegisterDeviceScreen} from "../screen/register-device";
import {ActivateDeviceScreen} from "../screen/activate-device";

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        HttpModule,
        ReactiveFormsModule,
        Routing
    ],
    bootstrap: [
        AppComponent
    ],
    declarations: [
        ActivateDeviceScreen,
        AppComponent,
        RegisterDeviceScreen,
        LoginScreen,
        OptionsScreen,
        PopupScreen
    ],
    providers: [
        ApiService,
        AppRoutingProvider,
        {
            provide: APP_BASE_HREF,
            useValue: '/'
        },
        ConfigService,
        DeviceService,
        LocalStorageService,
        OAuthService,
        UserService
    ]
})

export class AppModule {

}
