
export class TypedStorage {

    readonly storage: Storage;

    constructor(storage?: Storage) {
        this.storage = !storage ? window.localStorage : storage;
    }

    setItem<T>(name: string, value: T) {
        if (!this.storage) {
            return;
        }
        if (value === null) {
            this.storage.removeItem(name);
            return;
        }
        switch (typeof value) {
            case 'string':
            case 'boolean':
            case 'number':
                this.storage.setItem(name, value + '');
                break;
            case 'object':
                this.storage.setItem(name, JSON.stringify(value));
                break;
            case 'undefined':
                this.storage.removeItem(name);
                break;
        }
    }

    getItem<T>(name: string, defaultValue: T): T | null {
        if (!this.storage) {
            return null;
        }
        const stringValue = this.storage.getItem(name);
        if (stringValue === null) {
            return defaultValue;
        }
        switch (typeof defaultValue) {
            case 'string':
                return stringValue as unknown as T;
            case 'boolean':
                return (stringValue.toLowerCase() === 'true') as unknown as T;
            case 'number':
                return parseFloat(stringValue) as unknown as T;
            case 'object':
                return JSON.parse(stringValue) as unknown as T;
        }
        throw new Error('illegal defaultValue');
    }

    getItemAsProperty<T, V>(object: T, propertyName: keyof T, defaultValue: V) {
        let value: V | null = this.getItem(propertyName as string, defaultValue);
        if (value !== null) {
            object[propertyName] = value as any;
        }
    }

    setItemFromProperty<T, V>(object: T, propertyName: keyof T, defaultValue: V) {
        let value: V = object[propertyName] as unknown as V;
        if (typeof value === 'undefined') {
            value = defaultValue;
        }
        this.setItem(propertyName as string, value);
    }
}

// export const localStorage = new TypedStorage(window.localStorage);
// export const sessionStorage = new TypedStorage(window.sessionStorage);
