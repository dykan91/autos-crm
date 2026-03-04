export type ContractPdfCar = {
    title: string;
    vin: string;
    kfzBriefNr: string;
    ez: string;
    color: string;
};

export type ContractPdfClient = {
    name: string;
    address: string;
    postalCity: string;
};

export type ContractPdfData = {
    invoiceNr: string;
    cityDateRight: string;
    client: ContractPdfClient;
    car: ContractPdfCar;
};
