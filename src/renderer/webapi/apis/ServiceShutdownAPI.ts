
export class ServiceShutdownAPI {
    shutdown(serviceURL: string): Promise<null> {
        const url = new URL(serviceURL + "/kill");
        return fetch(serviceURL + "/exit")
            .then((response: Response) => {
                return null;
            });
    }
}
