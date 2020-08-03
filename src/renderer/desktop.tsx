import copyToClipboard from 'copy-to-clipboard';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Native, Electron-based dialogs, file choosers and message boxes

export interface FileFilter {
    name: string;
    extensions: string[];
}

export type OpenDialogProperty =
    'openFile'
    | 'openDirectory'
    | 'multiSelections'
    | 'createDirectory'
    | 'showHiddenFiles';

/**
 * See dialog.showSaveDialog() in https://github.com/electron/electron/blob/master/docs/api/dialog.md
 */
export interface FileDialogOptions {
    title?: string;
    defaultPath?: string;
    /**
     * Custom label for the confirmation button, when left empty the default label will be used.
     */
    buttonLabel?: string;
    filters?: FileFilter[];
}

/**
 * See dialog.showSaveDialog() in https://github.com/electron/electron/blob/master/docs/api/dialog.md
 */
export interface SaveDialogOptions extends FileDialogOptions {
}

/**
 * See dialog.showOpenDialog() in https://github.com/electron/electron/blob/master/docs/api/dialog.md
 */
export interface OpenDialogOptions extends FileDialogOptions {
    /**
     * Contains which features the open dialog should use.
     */
    properties?: OpenDialogProperty[];
    /**
     * Normalize the keyboard access keys across platforms.
     * Default is false. Enabling this assumes & is used in the button labels for the placement of the
     * keyboard shortcut access key and labels will be converted so they work correctly on each platform,
     * & characters are removed on macOS, converted to _ on Linux, and left untouched on Windows.
     * For example, a button label of Vie&w will be converted to Vie_w on Linux and View on macOS and can
     * be selected via Alt-W on Windows and Linux.
     */
    normalizeAccessKeys?: boolean;
}

/**
 * See dialog.showMessageBox() in https://github.com/electron/electron/blob/master/docs/api/dialog.md
 */
export interface MessageBoxOptions {
    /**
     * Can be "none", "info", "error", "question" or "warning". On Windows, "question" displays the same icon as "info", unless you set an icon using the "icon" option.
     */
    type?: string;

    /**
     * Array of texts for buttons. On Windows, an empty array will result in one button labeled "OK".
     */
    buttons?: string[];

    /**
     * Title of the message box, some platforms will not show it.
     */
    title?: string;

    /**
     * Content of the message box.
     */
    message: string;

    /**
     * Extra information of the message.
     */
    detail?: string;

    /**
     *  NativeImage: https://github.com/electron/electron/blob/master/docs/api/native-image.md
     */
    icon?: any;

    /**
     * Index of the button in the buttons array which will be selected by default when the message box opens.
     */
    defaultId?: number;

    /**
     * The value will be returned when user cancels the dialog instead of clicking the buttons of the dialog.
     * By default it is the index of the buttons that have "cancel" or "no" as label, or 0 if there is no such buttons.
     * On macOS and Windows the index of the "Cancel" button will always be used as cancelId even if it is specified.
     */
    cancelId?: number;

    /**
     * On Windows Electron will try to figure out which one of the buttons are common buttons (like "Cancel" or "Yes"),
     * and show the others as command links in the dialog. This can make the dialog appear in the style of modern
     * Windows apps. If you don't like this behavior, you can set noLink to true.
     */
    noLink?: boolean;

    /**
     * If provided, the message box will include a checkbox with the given label.
     * The checkbox state can be inspected only when using callback.
     */
    checkboxLabel?: string;

    /**
     * Initial checked state of the checkbox. false by default.
     */
    checkboxChecked?: boolean;
}

export interface MessageBoxResult {
    buttonIndex: number;
    checkboxChecked: boolean;
}

export interface DesktopActions {
    /**
     * Shows a file-open dialog.
     *
     * @param openDialogOptions the file-open dialog options
     * @returns the array of selected file paths or null, if no file path was selected.
     */
    showFileOpenDialog(openDialogOptions: OpenDialogOptions): Promise<string[] | null>;

    /**
     * Shows a  file-save dialog.
     *
     * @param saveDialogOptions the file-save dialog options
     * @returns the selected filePath or null, if no file path was selected.
     */
    showFileSaveDialog(saveDialogOptions: SaveDialogOptions): Promise<string | null>;

    /**
     * Shows a message box.
     *
     * @param messageBoxOptions the message dialog options
     * @returns null, if no button was selected. Otherwise an object {buttonIndex, checkboxChecked}.
     */
    showMessageBox(messageBoxOptions: MessageBoxOptions): Promise<MessageBoxResult | null>;

    /**
     * Show the given file in a file manager. If possible, select the file.
     * @param fullPath
     */
    showItemInFolder(fullPath: string): Promise<boolean>;

    /**
     * Open the given file in the desktop's default manner.
     * @param fullPath
     */
    openItem(fullPath: string): Promise<boolean>;

    /**
     * Open the given URL in the desktop's default manner.
     *
     * @param url The URL.
     * @returns {boolean}
     */
    openExternal(url: string): Promise<boolean>;

    /**
     * Copies given text to clipboard.
     * @param text The text to be copied.
     */
    copyTextToClipboard(text: string): Promise<boolean>;
}

let desktopActionsImpl: DesktopActions;


// Requires preload.js in cate-desktop:  import * as electron from 'electron'; (window as any).electron = electron;
const electron = (window as any).electron;


if (Boolean(electron)) {

    desktopActionsImpl = {

        showFileOpenDialog: (openDialogOptions: OpenDialogOptions): Promise<string[] | null> => {
            const actionName = 'show-open-dialog';
            electron.ipcRenderer.send(actionName, openDialogOptions, false);
            return new Promise((callback: (filePaths: string[] | null) => any) => {
                electron.ipcRenderer.once(actionName + '-reply', (event, filePaths: string[]) => {
                    callback(filePaths);
                });
            });
        },


        showFileSaveDialog: (saveDialogOptions: SaveDialogOptions): Promise<string | null> => {
            const actionName = 'show-save-dialog';
            electron.ipcRenderer.send(actionName, saveDialogOptions, false);
            return new Promise((callback: (filePath: string | null) => any) => {
                electron.ipcRenderer.once(actionName + '-reply', (event, filePath: string) => {
                    callback(filePath);
                });
            });
        },

        showMessageBox: (messageBoxOptions: MessageBoxOptions): Promise<MessageBoxResult | null> => {
            const actionName = 'show-message-box';
            if (!messageBoxOptions.buttons) {
                messageBoxOptions = {...messageBoxOptions, buttons: ['OK']};
            }
            electron.ipcRenderer.send(actionName, messageBoxOptions, false);
            return new Promise((callback: (result: MessageBoxResult | null) => any) => {
                electron.ipcRenderer.once(actionName + '-reply', (event, buttonIndex: number, checkboxChecked: boolean) => {
                    callback({buttonIndex, checkboxChecked});
                });
            });
        },

        showItemInFolder: (fullPath: string): Promise<boolean> => {
            return Promise.resolve(electron.shell.showItemInFolder(fullPath));
        },

        openItem: (fullPath: string): Promise<boolean> => {
            return Promise.resolve(electron.shell.openItem(fullPath));
        },


        openExternal: (url: string): Promise<boolean> => {
            return Promise.resolve(electron.shell.openExternal(url));
        },

        copyTextToClipboard: (text: string): Promise<boolean> => {
            return electron.clipboard.writeText(text);
            // copyToClipboard(text);
        },
    }
} else {
    const warn = <T extends any>(functionName: string, result: T): Promise<T> => {
        if (!electron) {
            console.warn(`${functionName}() cannot be executed, module electron not available`);
        } else if (!electron.ipcRenderer) {
            console.warn(`${functionName}() cannot be executed, module electron.ipcRenderer not available`);
        }
        return Promise.resolve(result);
    };

    // noinspection JSUnusedLocalSymbols
    desktopActionsImpl = {

        showFileOpenDialog: (openDialogOptions: OpenDialogOptions): Promise<string[] | null> => {
            // TODO (forman): implement me!
            return warn('showFileOpenDialog', null);
        },

        showFileSaveDialog: (saveDialogOptions: SaveDialogOptions): Promise<string | null> => {
            // TODO (forman): implement me!
            return warn('showFileSaveDialog', null);
        },

        showMessageBox: (messageBoxOptions: MessageBoxOptions): Promise<MessageBoxResult | null> => {
            // TODO (forman): implement me!
            return warn('showMessageBox', null);
        },

        showItemInFolder: (fullPath: string): Promise<boolean> => {
            // TODO (forman): implement me!
            return warn('showItemInFolder', false);
        },

        openItem: (fullPath: string): Promise<boolean> => {
            // TODO (forman): implement me!
            return warn('openItem', false);
        },

        openExternal: (url: string): Promise<boolean> => {
            // TODO (forman): implement me!
            return warn('openExternal', false);
        },

        copyTextToClipboard: (text: string): Promise<boolean> => {
            // TODO (forman): implement me!
            return new Promise((callback: (result: boolean) => any) => {
                copyToClipboard(text, {onCopy: () => callback(true)});
            });
        },
    }
}

export const desktopActions = desktopActionsImpl;
