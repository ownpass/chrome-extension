import {AccountInterface} from "../interfaces/account";
import {Injectable} from "@angular/core";
import {ApiService} from "./api";

@Injectable()
export class UserService {
    url: string = '/user';

    constructor(private apiService: ApiService) {
    }

    get = () => {
        return this.apiService.get(this.url).map(
            response => response.json()
        );
    }

    persist(account: AccountInterface) {
        return this.apiService.put(this.url, account).map(
            response => response.json()
        );
    }
}
