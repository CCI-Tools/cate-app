import { DatasetDescriptor, DataSourceState, DataStoreState, DimSizes } from '../../state';
import { JobProgress, JobPromise } from '../Job';
import { WebAPIClient } from '../WebAPIClient';


export class DatasetAPI {
    private readonly webAPIClient: WebAPIClient;

    constructor(webAPIClient: WebAPIClient) {
        this.webAPIClient = webAPIClient;
    }

    getDataStores(): JobPromise<DataStoreState[]> {
        return this.webAPIClient.call('get_data_stores', []);
    }

    getDataSources(dataStoreId: string,
                   onProgress: (progress: JobProgress) => void): JobPromise<DataSourceState[]> {
        return this.webAPIClient.call('get_data_sources',
                                      [dataStoreId],
                                      onProgress,
                                      DatasetAPI.responseToDataSources);
    }

    getDataSourceMetaInfo(dataStoreId: string, dataSourceId: string,
                          onProgress: (progress: JobProgress) => void): JobPromise<DatasetDescriptor> {
        return this.webAPIClient.call('get_data_source_meta_info',
                                      [dataStoreId, dataSourceId],
                                      onProgress,
                                      DatasetAPI.responseToMetaInfo);
    }

    addLocalDataSource(dataSourceId: string, filePathPattern: string,
                       onProgress: (progress: JobProgress) => void): JobPromise<DataSourceState[]> {
        return this.webAPIClient.call('add_local_data_source',
                                      [dataSourceId, filePathPattern],
                                      onProgress);
    }

    removeLocalDataSource(dataSourceId: string, removeFiles: boolean,
                          onProgress: (progress: JobProgress) => void): JobPromise<DataSourceState[]> {
        return this.webAPIClient.call('remove_local_data_source',
                                      [dataSourceId, removeFiles],
                                      onProgress);
    }

    extractPixelValues(baseDir: string,
                       source: string,
                       point: [number, number],
                       indexers: DimSizes): JobPromise<{ [varName: string]: number } | null> {
        return this.webAPIClient.call('extract_pixel_values', [baseDir, source, point, indexers]);
    }

    static responseToDataSources(dataSources: any[]): DataSourceState[] {
        // noinspection JSUnusedLocalSymbols
        return dataSources.map((dataSource, i): DataSourceState => {
            console.debug(`dataSources[${i}]:`, dataSource);
            return {
                id: dataSource['id'],
                title: dataSource['title'],
                typeSpecifier: dataSource['type_specifier'] || 'dataset',
                verificationFlags: dataSource['verification_flags'],
                metaInfoStatus: 'init',
            };
        });
    }

    static responseToMetaInfo(response: any): DatasetDescriptor {
        return response as DatasetDescriptor;
    }
}

