import {ModuleWithProviders} from "@angular/core";
import {Routes, RouterModule} from "@angular/router";
import {PopupScreen} from "../screen/popup";
import {OptionsScreen} from "../screen/options";
import {LoginScreen} from "../screen/login";
import {RegisterDeviceScreen} from "../screen/register-device";
import {ActivateDeviceScreen} from "../screen/activate-device";

const appRoutes: Routes = [
    {
        path: 'html/activate-device.html',
        component: ActivateDeviceScreen
    },
    {
        path: 'html/login.html',
        component: LoginScreen
    },
    {
        path: 'html/options.html',
        component: OptionsScreen
    },
    {
        path: 'html/popup.html',
        component: PopupScreen
    },
    {
        path: 'html/register-device.html',
        component: RegisterDeviceScreen
    }
];

export const AppRoutingProvider: any[] = [];

export const Routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);
