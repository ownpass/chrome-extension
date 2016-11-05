import {Component} from "@angular/core";
import {FormGroup, FormControl} from "@angular/forms";
import {Router} from "@angular/router";
import {DeviceCode} from "../interfaces/device";
import {DeviceService} from "../service/device";

@Component({
    selector: 'ownpass-screen-activate-device',
    templateUrl: 'activate-device.html'
})

export class ActivateDeviceScreen {
    public submitted: boolean;
    public status: string;
    public activateDeviceForm: FormGroup = new FormGroup({
        code: new FormControl('')
    });

    constructor(private router: Router,
                private deviceService: DeviceService) {
    }

    onSubmit = (submitEvent: Event, model: DeviceCode) => {
        this.submitted = true;

        if (!this.activateDeviceForm.valid) {
            return;
        }

        this.deviceService.activate(model.code).subscribe(
            response => {
                this.router.navigateByUrl('html/popup.html');
            },
            error => {
                if (error.status === 401) {
                    this.router.navigateByUrl('html/login.html');
                    return;
                }

                // TODO: Handle errors
                console.log(error);
            }
        );
    }
}

