import { HostOS } from "../../../../common/paths";

// TODO (forman): file choosers: use FilePath class internally in FileDialog instead of the path strings used now.


/**
 * Represents a file path.
 */
export class FilePath {
    private _parent?: FilePath | null;
    private _components?: string[];
    private _pathname?: string;
    readonly hostOS?: HostOS;


    constructor(pathnameOrComponents: string | string[], hostOS?: HostOS) {
        if (typeof pathnameOrComponents === 'string') {
            // Validate/Normalize
            this._pathname = pathnameOrComponents;
        } else if (Array.isArray(pathnameOrComponents)) {
            // Validate/Normalize
            this._components = [...pathnameOrComponents];
        }
        this.hostOS = hostOS;
    }

    get components(): string[] {
        if (this._components === undefined) {
            // TODO: "//" prefix
            this._components = this._pathname.split('/');
        }
        return this._components;
    }

    get pathname(): string {
        if (this._pathname === undefined) {
            // TODO: "//" prefix
            this._pathname = this._components.join('/');
        }
        return this._pathname;
    }

    get parent(): FilePath | undefined {
        if (this._parent === undefined) {
            const components = this.components;
            if (components.length > 1) {
                this._parent = new FilePath(components.slice(0, components.length - 1), this.hostOS);
            } else {
                this._parent = null;
            }
        }
        return this._parent;
    }

    get basename(): string {
        const components = this.components;
        if (components.length > 0) {
            return components[components.length - 1];
        } else {
            return '';
        }
    }

    slice(start?: number, end?: number): FilePath {
        return new FilePath(this.components.slice(start, end));
    }

    isRelative(): boolean {
        return !this.isAbsolute();
    }

    isAbsolute(): boolean {
        const components = this.components;
        if (components.length > 0) {
            const name = components[0];
            if (this.isWindows()) {
                if (name.length === 2) {
                    return name[1] === ':' && /^[a-z]+$/i.test(name[0]);
                } else {
                    return name.startsWith('//');
                }
            } else {
                return name === '/';
            }
        }
        return false;
    }

    isWindows(): boolean {
        return this.hostOS === 'Windows';
    }
}
