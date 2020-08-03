
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// File choosers, message boxes, and other Desktop integrations

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
    type?: "none" | "info" | "error" | "question" | "warning";

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
    message?: string;

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
     * true for electron.
     */
    isNativeUI: boolean;

    /**
     * Shows a file-open dialog.
     *
     * @param openDialogOptions the file-open dialog options
     * @param onClose called when the dialog is closed
     * @returns the array of selected file paths or null, if no file path was selected.
     */
    showFileOpenDialog(openDialogOptions: OpenDialogOptions, onClose: (filePaths: string[] | null) => any): void;

    /**
     * Shows a  file-save dialog.
     *
     * @param saveDialogOptions the file-save dialog options
     * @param onClose called when the dialog is closed
     * @returns the selected filePath or null, if no file path was selected.
     */
    showFileSaveDialog(saveDialogOptions: SaveDialogOptions, onClose: (filePath: string | null) => any): void;

    /**
     * Shows a message box.
     *
     * @param messageBoxOptions the message dialog options
     * @param onClose called when the dialog is closed
     * @returns null, if no button was selected. Otherwise an object {buttonIndex, checkboxChecked}.
     */
    showMessageBox(messageBoxOptions: MessageBoxOptions, onClose: (result: MessageBoxResult | null) => any): void;

    /**
     * Show the given file in a file manager. If possible, select the file.
     * @param fullPath
     */
    showItemInFolder?(fullPath: string): Promise<boolean>;

    /**
     * Open the given file in the desktop's default manner.
     * @param fullPath
     */
    openItem?(fullPath: string): Promise<boolean>;

    /**
     * Open the given URL in the desktop's default manner.
     *
     * @param url The URL.
     * @returns {boolean}
     */
    openExternal?(url: string): Promise<boolean>;

    /**
     * Copies given text to clipboard.
     * @param text The text to be copied.
     */
    copyTextToClipboard(text: string): Promise<boolean>;
}

