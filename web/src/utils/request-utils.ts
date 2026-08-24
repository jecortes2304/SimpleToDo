const inFlightRequests = new Map<string, Promise<unknown>>();

/** Reuses an identical request while it is in flight (not a response cache). */
export function dedupeRequest<Result>(key: string, requestFactory: () => Promise<Result>): Promise<Result> {
    const pendingRequest = inFlightRequests.get(key) as Promise<Result> | undefined;
    if (pendingRequest) return pendingRequest;

    const request = requestFactory();
    const trackedRequest = request.finally(() => {
        if (inFlightRequests.get(key) === trackedRequest) {
            inFlightRequests.delete(key);
        }
    });

    inFlightRequests.set(key, trackedRequest);
    return trackedRequest;
}
