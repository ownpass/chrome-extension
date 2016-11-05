import {Injectable} from '@angular/core';

@Injectable()
export class LocalStorageService {
    get = (key: string) => {
        return localStorage.getItem(key);
    }

    set = (key: string, value: string) => {
        localStorage.setItem(key, value);
    }

    getJSON = (key: string) => {
        return JSON.parse(localStorage.getItem(key));
    }

    setJSON = (key: string, value: JSON) => {
        localStorage.setItem(key, JSON.stringify(value));
    }

    remove = (key: string) => {
        localStorage.removeItem(key);
    }
}
