import ResourceBundle from "sap/base/i18n/ResourceBundle";
import DateFormat from "sap/ui/core/format/DateFormat";
import Controller from "sap/ui/core/mvc/Controller";
import ResourceModel from "sap/ui/model/resource/ResourceModel";

/**
* Rounds the currency value to 2 digits
*
* @param value value to be formatted
* @returns formatted currency value with 2 digits
*/
export function formatValue(value: string): string {
    return value?.toUpperCase();
}

export function formatNumber(value: string): string {
    return parseFloat(value).toFixed(2).toString();
}

export function formatText(value: Record<string, any>, resourceBundle: ResourceBundle) {

    return Array.isArray(value) ? value.map(x => {
        if (x.PropName) {
            return `${x.PropName}:${(x.PropVal) === "01" ? resourceBundle.getText("Optional") : x.PropVal === "02" ?
                resourceBundle.getText("Mandatory") : x.PropVal}`;
        }
        else
            return x;
    }).join("\u000a") : value;

}

export function formatDate(date: Date) {
    const dateFormat = DateFormat.getDateInstance({ pattern: "dd.MM.yyyy" });
    return dateFormat.format(date);
}

export function formatTime(time: any) {
    let seconds = Math.floor(time.ms / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    seconds = seconds % 60;
    minutes = minutes % 60;

    // @ts-ignore
    return `${hours.toString().padStart(2, 0)}:${minutes.toString().padStart(2, 0)}:${seconds.toString().padStart(2, 0)}`;
}

export function formatStatus(value: boolean) {

    return (value) ? "Success" : "Warning";

}

export function formatStatusText(this: Controller, value: boolean) {
    const resourceBundle = <ResourceBundle>(<ResourceModel>this?.getOwnerComponent()?.getModel("i18n"))?.getResourceBundle();

    return (value) ? resourceBundle.getText("Created") : resourceBundle.getText("NonCreated");

}

