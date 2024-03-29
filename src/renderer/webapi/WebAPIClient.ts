/**
 * A web API client and related type definitions.
 *
 * The implementation is based on WebSockets with a JSON-RPC-based protocol.
 * For JSON-RPC details see http://www.jsonrpc.org/specification.
 *
 * A WebAPI server must implement a general method "__cancel__(id: number): void"
 * which cancels the method for the given *id*. The method call must either succeed with any "response" value
 * or fail by returning an "error" object.
 *
 * If the WebAPI server has successfully cancelled a running job, an "error" object with code 999
 * must be returned.
 *
 * To report progress, the WebAPI server can send "progress" objects:
 *
 *   {
 *      work?: number,
 *      total?: number,
 *      message?: string
 *   }
 *
 * This is non JSON-RCP, which only allows for either the "response" or an "error" object.
 *
 * @author Norman Fomferra
 */

import { IconName, Intent } from '@blueprintjs/core';
import {
    Job,
    JobFailure,
    JobFailureHandler,
    JobProgress,
    JobProgressHandler,
    JobPromise,
    JobRequest,
    JobResponseHandler,
    JobStatus,
    JobStatusEnum
} from './Job'
import { WebSocketMin } from './WebSocketMock'

// IMPORTANT NOTE: The following error codes MUST BE COPIED from cate/util/web/jsonrpchandler.py
//
// See http://www.jsonrpc.org/specification#error_object
// The error codes from and including -32768 to -32000 are reserved for pre-defined errors.
export const ERROR_CODE_INVALID_REQUEST = -32600;
export const ERROR_CODE_METHOD_NOT_FOUND = -32601;
export const ERROR_CODE_INVALID_PARAMS = -32602;
// The error codes from and including -32000 to -32099 are reserved for implementation-defined server-errors.
export const ERROR_CODE_OS_ERROR = -32001;
export const ERROR_CODE_OUT_OF_MEMORY = -32002;
export const ERROR_CODE_METHOD_ERROR = -32003;
export const ERROR_CODE_INVALID_RESPONSE = -32004;
// The remainder of the space is available for application defined errors.
export const ERROR_CODE_CANCELLED = 999;

const CANCEL_METHOD = '__cancel__';
const DEBUG = false;


export type JobResponseTransformer<JobResponse> = (any) => JobResponse;

/**
 * The web API's call interface.
 *
 * The WebAPIClient class is used to perform remote calls to server-side methods and to observe
 * their progress, success, failure, or cancellation in an asynchronous fashion.
 *
 * A WebAPI server must implement a general method "__cancel__(id: number): void"
 * which cancels the method for the given *id*. The method call must either succeed with any "response" value
 * or fail by returning an "error" object.
 *
 * If the WebAPIClient server has successfully cancelled a running job, an "error" object with the code
 * given by the CANCELLED_CODE constant (999) must be returned.
 *
 * To report progress, the WebAPIClient server can send "progress" objects:
 *
 *   {
 *      id: number;
 *      label?: string;
 *      message?: string;
 *      worked?: number;
 *      total?: number;
 *   }
 *
 * This is non JSON-RCP, which only allows for either the "response" or an "error" object.
 */
export interface WebAPIClient {
    /**
     * Test if the connection is open and active.
     */
    readonly isOpen: boolean;
    readonly url: string;

    onOpen: (event) => void;
    onClose: (event) => void;
    onError: (event) => void;
    onWarning: (event) => void;

    /**
     * Perform a JSON-RPC call.
     *
     * @param method The method name.
     * @param params The method parameters, either a list with positional arguments or an object
     *               providing keyword arguments.
     * @param onProgress An optional handler that is notified while the Job progresses.
     *        Note that not all server-side methods provide progress notifications.
     * @param transformer Optional transformer for the returned responses
     */
    call<JobResponse>(method: string,
                      params: Array<any> | Object,
                      onProgress?: (progress: JobProgress) => void,
                      transformer?: JobResponseTransformer<JobResponse>): JobPromise<JobResponse>;

    /**
     * Cancels the job with the given ID.
     *
     * @param jobId the job ID
     */
    cancel(jobId: number);

    /**
     * Closes this client and the underlying connection, if any.
     */
    close(): void;
}

/**
 * Creates a new WebAPIClient.
 *
 * The implementation uses WebSockets with a JSON-RPC-based protocol.
 * For JSON-RPC details see http://www.jsonrpc.org/specification.
 *
 * @param url The WebSocket URL. WebSocket URL must start with "ws://".
 * @param firstMessageId The ID of the first JSON-RPC method call.
 * @param socket Alternative WebSocket instance for testing.
 * @returns {WebAPIClient} instance.
 */
export function newWebAPIClient(url: string, firstMessageId = 0, socket?: WebSocketMin): WebAPIClient {
    return new WebAPIClientImpl(url, firstMessageId, socket);
}

class WebAPIClientImpl implements WebAPIClient {

    readonly url: string;
    onOpen: (event: Event) => void;
    onClose: (event: CloseEvent) => void;
    onError: (event: ErrorEvent) => void;
    onWarning: (event) => void;

    private readonly socket: WebSocketMin;
    private currentMessageId = 0;
    private readonly activeJobs: JobImpl<any>[];

    constructor(url: string, firstMessageId = 0, socket?: WebSocketMin) {
        this.url = url;
        this.currentMessageId = firstMessageId;
        this.activeJobs = [];
        this.socket = socket ? socket : new WebSocket(url);
        this.socket.onopen = (event: Event) => {
            if (DEBUG && process.env.NODE_ENV === 'development') {
                console.debug("WebSocket.onopen:", event);
            }
            if (this.onOpen) {
                this.onOpen(event);
            }
        };
        this.socket.onclose = (event: CloseEvent) => {
            if (DEBUG && process.env.NODE_ENV === 'development') {
                console.debug("WebSocket.onclose:", event);
            }
            if (this.onClose) {
                this.onClose(event);
            }
        };
        this.socket.onerror = (event: ErrorEvent) => {
            if (DEBUG && process.env.NODE_ENV === 'development') {
                console.debug("WebSocket.onerror:", event);
            }
            if (this.onError) {
                this.onError(event);
            }
        };
        this.socket.onmessage = (event: MessageEvent) => {
            if (DEBUG && process.env.NODE_ENV === 'development') {
                console.debug("WebSocket.onmessage:", event);
            }
            this.processMessage(event.data);
        }
    }

    get isOpen(): boolean {
        return this.socket.readyState === WebSocket.OPEN;
    }

    call<JobResponse>(method: string,
                      params: Array<any> | Object,
                      onProgress?: (progress: JobProgress) => void,
                      transformer?: JobResponseTransformer<JobResponse>): JobPromise<JobResponse> {
        const request = {
            'id': this.newId(),
            'method': method,
            'params': params,
        };
        const job = new JobImpl(this, request, transformer);
        this.activeJobs[request.id] = job;
        return job.invoke(onProgress);
    }

    cancel(jobId: number): void {
        const job = this.activeJobs[jobId];
        if (!job) {
            this.warn(`Job with "id"=${jobId} does not exist`);
            return;
        } else {
            job.cancel();
        }
    }

    close(): void {
        this.socket.close();
    }

    sendMessage(request: JobRequest) {
        // console.log('WebAPIClient.sendMessage: request=', request)
        const message = Object.assign({}, {jsonrpc: '2.0'}, request);
        const messageText = JSON.stringify(message);
        this.socket.send(messageText);
    }

    private processMessage(messageText: string): void {
        let message;
        try {
            // JSON does not recognise NaN
            // See https://stackoverflow.com/questions/15228651/how-to-parse-json-string-containing-nan-in-node-js
            // message = JSON.parse(messageText);
            // So we use evil eval() because JSON is valid JavaScript:
            // eslint-disable-next-line
            message = eval(`(${messageText})`);
            // We cannot use the following naive approach, because "NaN" appears as word in operation doc strings
            // const TEMP_NAN_STR = '[[<<~~***NaN***~~>>]]';
            // const TEMP_NAN_JSON_STR = `"${TEMP_NAN_STR}"`;
            // message = JSON.parse(messageText.replace(/\bNaN\b/g, TEMP_NAN_JSON_STR),
            //                      (key, value) => value === TEMP_NAN_STR ? NaN : value);
        } catch (err) {
            this.warnInvalidJsonRcpMessage('Message is no valid JSON', messageText);
            return;
        }
        if (message.jsonrpc !== '2.0' || typeof message.id !== 'number') {
            this.warnInvalidJsonRcpMessage('Message is not JSON-RCP 2.0 compliant', messageText);
            return;
        }

        const job = this.activeJobs[message.id];
        if (!job) {
            this.warnInvalidJsonRcpMessage(`Method with "id"=${message.id} has no associated job`, messageText);
            return;
        }

        if (message.response || message.response === null) {
            job.notifyDone(message.response);
            delete this.activeJobs[message.id];
        } else if (message.progress) {
            message.progress.id = message.id;
            job.notifyInProgress(message.progress)
        } else if (message.error) {
            job.notifyFailed(message.error);
            delete this.activeJobs[message.id];
        } else {
            this.warnInvalidJsonRcpMessage(`Method is neither a "response", "progress", nor "error"`, messageText);
            return;
        }
    }

    private warnInvalidJsonRcpMessage(detailsMessage: string, jsonRcpMessage: string) {
        if (this.onWarning) {
            const message = `Received invalid JSON-RCP message from Cate service. ${detailsMessage}. Ignoring it.\n--------------------\n${jsonRcpMessage}\n--------------------`;
            this.onWarning({type: 'warning', message});
        }
    }

    private warn(message: string) {
        if (this.onWarning) {
            this.onWarning({type: 'warning', message});
        }
    }

    private newId(): number {
        return this.currentMessageId++;
    }
}

/**
 * Default implementation of the Job interface which uses the default WebAPI implementation.
 */
class JobImpl<JobResponse> implements Job {

    private webAPIClient: WebAPIClientImpl;
    private request: JobRequest;
    private status: JobStatus;
    private onProgress: JobProgressHandler;
    private onResolve: JobResponseHandler<JobResponse>;
    private onReject: JobFailureHandler;
    private transformer: JobResponseTransformer<JobResponse>;

    constructor(webAPIClient: WebAPIClientImpl, request: JobRequest, transformer: JobResponseTransformer<JobResponse>) {
        this.webAPIClient = webAPIClient;
        this.request = request;
        this.status = JobStatusEnum.NEW;
        this.transformer = transformer;
    }

    getRequest() {
        return this.request;
    }

    getStatus(): JobStatus {
        return this.status;
    }

    isCancelled(): boolean {
        return this.status === JobStatusEnum.CANCELLED;
    }

    cancel(onResolve?: JobResponseHandler<void>,
           onReject?: JobFailureHandler): void {
        this.webAPIClient.call<void>(CANCEL_METHOD, {id: this.request.id})
            .then(onResolve || (() => {
            }), onReject || (() => {
            }));
    }

    ////////////////////////////////////////////////////////////
    // Implementation details

    invoke(onProgress?: JobProgressHandler): JobPromise<JobResponse> {

        const executor = (onResolve: JobResponseHandler<JobResponse>, onReject: JobFailureHandler) => {
            this.setHandlers(onProgress, onResolve, onReject);
            this.sendMessage();
            this.setStatus(JobStatusEnum.SUBMITTED);
        };

        const promise = new Promise<JobResponse>(executor.bind(this));
        // Convert the plain promise into a JobPromise
        promise['getJob'] = this.getJob.bind(this);
        promise['getJobId'] = this.getJobId.bind(this);
        return promise as JobPromise<JobResponse>;
    }

    notifyInProgress(progress: JobProgress) {
        this.setStatus(JobStatusEnum.IN_PROGRESS);
        if (this.onProgress) {
            this.onProgress(progress);
        }
    }

    notifyDone(response: JobResponse) {
        this.setStatus(JobStatusEnum.DONE);
        if (this.onResolve) {
            this.onResolve(this.transformer ? this.transformer(response) : response);
        }
    }

    notifyFailed(failure: JobFailure) {
        this.setStatus(failure.code === ERROR_CODE_CANCELLED ? JobStatusEnum.CANCELLED : JobStatusEnum.FAILED);
        if (this.onReject) {
            this.onReject(failure);
        }
    }

    private getJob(): Job {
        return this;
    }

    private getJobId(): number {
        return this.getRequest().id;
    }

    private setHandlers(onProgress, onResolve, onReject) {
        this.onProgress = onProgress;
        this.onResolve = onResolve;
        this.onReject = onReject;
    }

    private sendMessage() {
        this.webAPIClient.sendMessage(this.request);
    }

    private setStatus(status: JobStatus) {
        this.status = status;
    }
}

export function getJobFailureIntentName(failure: JobFailure): Intent {
    if (failure) {
        switch (failure.code) {
            case ERROR_CODE_INVALID_PARAMS:
            case ERROR_CODE_CANCELLED:
                return Intent.PRIMARY;
            case ERROR_CODE_OS_ERROR:
                return Intent.WARNING;
            default:
                return Intent.WARNING;
        }
    }
    return Intent.WARNING;
}

export function getJobFailureIconName(failure: JobFailure): IconName {
    if (failure) {
        if (failure.data) {
            if (failure.data.exception === 'cate.core.ds.NetworkError') {
                return 'offline';
            }
            if (failure.data.exception === 'cate.core.ds.DataAccessError') {
                return 'database';
            }
        }
        switch (failure.code) {
            case ERROR_CODE_INVALID_PARAMS:
                return 'manually-entered-data';
            case ERROR_CODE_CANCELLED:
                return 'hand';
            default:
                return 'error';
        }
    }
    return 'warning-sign';
}

export function getJobFailureTitle(failure: JobFailure): string {

    if (failure) {
        console.log(failure);
        if (failure.data) {
            if (failure.data.exception === 'cate.core.ds.NetworkError') {
                return 'Network Problem';
            }
            if (failure.data.exception === 'cate.core.ds.DataAccessError') {
                return 'Data Access Error';
            }
        }
        switch (failure.code) {
            case ERROR_CODE_INVALID_PARAMS:
                return 'Invalid Input';
            case ERROR_CODE_OUT_OF_MEMORY:
                return 'Out-Of-Memory Error';
            case ERROR_CODE_OS_ERROR:
                return 'External Problem';
            case ERROR_CODE_CANCELLED:
                return 'Task Cancelled';
            case ERROR_CODE_METHOD_NOT_FOUND:
                return 'Internal Error (Method Not Found)';
            case ERROR_CODE_INVALID_REQUEST:
                return 'Internal Error (Invalid Request)';
            case ERROR_CODE_INVALID_RESPONSE:
                return 'Internal Error (Invalid Response)';
            case ERROR_CODE_METHOD_ERROR:
                return 'Operation Error';
        }
    }

    return 'Unknown Error';
}

const NON_DEVELOPER_ERRORS = [
    ERROR_CODE_INVALID_PARAMS,
    ERROR_CODE_CANCELLED,
    ERROR_CODE_OS_ERROR,
    ERROR_CODE_OUT_OF_MEMORY,
];

export function isDeveloperError(failure: JobFailure): boolean {
    return NON_DEVELOPER_ERRORS.indexOf(failure.code) < 0;
}


const USER_ERRORS = [
    ERROR_CODE_INVALID_PARAMS,
    ERROR_CODE_CANCELLED,
];

export function isUserError(failure: JobFailure): boolean {
    return USER_ERRORS.indexOf(failure.code) >= 0;
}
