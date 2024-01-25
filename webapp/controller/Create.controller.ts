import BaseController from "./BaseController";
import { createModel } from "../model/models";

/**
 * @namespace com.ntt.chatgptportal.controller
 */
export default class Create extends BaseController {

    /*eslint-disable @typescript-eslint/no-empty-function*/
    public onInit(): void {
        this.getRouter()?.getRoute("create")?.attachPatternMatched(this._onMatched, this);
    }

    private _onMatched() {
        this.setModel(createModel(), "model");
    }

    private onPressAddParam() {

    }

    private onPressDeleteParam() {

    }
}