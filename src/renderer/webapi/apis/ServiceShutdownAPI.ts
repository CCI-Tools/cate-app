
export class ServiceShutdownAPI {
    shutdown(serviceURL: string): Promise<null> {
        return fetch(serviceURL + "/exit")
            .then(() => null);
    }
}
