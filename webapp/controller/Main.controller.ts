import JSONModel from "sap/ui/model/json/JSONModel";
import BaseController from "./BaseController";

/**
 * @namespace com.ntt.chatgptportal.controller
 */
export default class Main extends BaseController {

    /*eslint-disable @typescript-eslint/no-empty-function*/
    public onInit(): void {
        this.setModel(new JSONModel({
            "milk": [
                {
                    "StoreName": "24-Seven",
                    "Revenue": 428214.13,
                    "Cost": 94383.52,
                    "Consumption": 76855.15368
                },
                {
                    "StoreName": "A&A",
                    "Revenue": 1722148.36,
                    "Cost": 274735.17,
                    "Consumption": 310292.22
                },
                {
                    "Store Name": "Alexei's Specialities",
                    "Revenue": 1331176.706884,
                    "Cost": 233160.58,
                    "Consumption": 143432.18
                }
            ]
        }), "vizModel")
    }

    private onPressFsToAbap() {
        this.getRouter().navTo("fstoabap");
    }

    private onPressAbapToFs() {
        this.getRouter().navTo("abaptofs");
    }
}