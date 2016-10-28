import {Component} from "@angular/core";
import {FormGroup, FormControl} from "@angular/forms";
import {Router} from "@angular/router";
import {DeviceData} from "../interfaces/device";
import {DeviceService} from "../service/device";
import {ApiService} from "../service/api";

@Component({
    selector: 'ownpass-screen-register-device',
    templateUrl: 'register-device.html'
})

export class RegisterDeviceScreen {
    public submitted: boolean;
    public status: string;
    public registerDeviceForm: FormGroup = new FormGroup({
        name: new FormControl(''),
        description: new FormControl('')
    });

    constructor(private router: Router,
                private apiService: ApiService,
                private deviceService: DeviceService) {
    }

    onSubmit = (submitEvent: Event, model: DeviceData) => {
        this.submitted = true;

        if (!this.registerDeviceForm.valid) {
            return;
        }

        // Reset the device id for this user:
        this.apiService.setDeviceId(this.apiService.username, null);

        this.deviceService.create(model.name, model.description).subscribe(
            response => {
                this.apiService.setDeviceId(this.apiService.username, response.id);

                this.router.navigateByUrl('html/activate-device.html');
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

