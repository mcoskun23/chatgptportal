import JSONModel from "sap/ui/model/json/JSONModel";
import BaseController from "./BaseController";
import { createModel, createViewModel, createDashboardModel, DocumentTypeEnum, ProcessTypeEnum } from "../model/models";
import ODataModel from "sap/ui/model/odata/v2/ODataModel";

/**
 * @namespace com.ntt.chatgptportal.controller
 */
export default class Main extends BaseController {

    /*eslint-disable @typescript-eslint/no-empty-function*/
    public onInit(): void {
        this.getRouter()?.getRoute("RouteMain")?.attachPatternMatched(this._onMatched, this);

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
    private _onMatched() {
        this.setModel(createDashboardModel(), "dashboardModel");
        this._cfDashboard();
    }
    private _cfDashboard() {
        const model = this.getModel<JSONModel>("dashboardModel");

        this.getModel<ODataModel>().callFunction("/Dashboard", {
            method: "POST",
            success: (response: any) => {
                const _q = response.Dashboard;

                model.setProperty("/AbapToFs", Number.isNaN(parseFloat(_q.AbapToFs)) ? 0 : parseFloat(_q.AbapToFs));
                model.setProperty("/AbapToTs", Number.isNaN(parseFloat(_q.AbapToTs)) ? 0 : parseFloat(_q.AbapToTs));
                model.setProperty("/Daily", Number.isNaN(parseFloat(_q.Daily)) ? 0 : parseFloat(_q.Daily));
                model.setProperty("/TsToAbap", Number.isNaN(parseFloat(_q.TsToAbap)) ? 0 : parseFloat(_q.TsToAbap));
                model.setProperty("/DailyUserCount", Number.isNaN(parseFloat(_q.DailyUserCount)) ? 0 : parseFloat(_q.DailyUserCount));
                model.setProperty("/FsToTs", Number.isNaN(parseFloat(_q.FsToTs)) ? 0 : parseFloat(_q.FsToTs));
                model.setProperty("/Regenerate", Number.isNaN(parseFloat(_q.Regenerate)) ? 0 : parseFloat(_q.Regenerate));
                model.setProperty("/Summary", Number.isNaN(parseFloat(_q.Summary)) ? 0 : parseFloat(_q.Summary));
                model.setProperty("/TotalTsAbap", model.getProperty("/FsToTs") + model.getProperty("/AbapToTs"));
                model.setProperty("/TotalFsTs", model.getProperty("/AbapToFs") + model.getProperty("/AbapToTs"));
            }
        });
    }
    private onPressFsToAbap() {
        this.getRouter().navTo("fstoabap");
    }

    private onPressAbapToFs() {
        this.getRouter().navTo("abaptofs");
    }
}