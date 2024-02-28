import JSONModel from "sap/ui/model/json/JSONModel";
import Device from "sap/ui/Device";

export enum DocumentTypeEnum {
    FsToTs = "01",
    TsToAbap = "02",
    AbapToTs = "03",
    AbapToFs = "04"
}

export enum ProcessTypeEnum {
    Create = "C",
    Update = "U"
}

export type FeedBack = {
    Developmentid: string,
    Projectid: string,
    ProcessType: ProcessTypeEnum
    Devpackage: string,
    Devprogram: string,
    Doctype: DocumentTypeEnum,
    Docno: string,
    Content: string
}

export type Regenerate = {
    Developmentid: string,
    Projectid: string,
    ProcessType: ProcessTypeEnum
    Devpackage: string,
    Devprogram: string,
    Doctype: DocumentTypeEnum,
    Docno: string,
    Feedback: string
}

export function createDeviceModel() {
    const model = new JSONModel(Device);
    model.setDefaultBindingMode("OneWay");
    return model;
}

export function createModel() {
    const data = {
        Projectid: "",
        Developmentid: "",
        ProcessType: ProcessTypeEnum.Create,
        Reportheader: "",
        Devmodule: "",
        Devtype: "",
        Devreason: "",
        Devpurpose: "",
        Devprocedure: "",
        Authobj: "",
        EstTime: false,
        SapVer: "01",
        Parameters: [],
        List: []
    }

    return new JSONModel(data);
}