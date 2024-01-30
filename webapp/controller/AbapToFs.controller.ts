import BaseController from "./BaseController";

/**
 * @namespace com.ntt.chatgptportal.controller
 */
export default class AbapToFs extends BaseController {

    /*eslint-disable @typescript-eslint/no-empty-function*/
    public onInit(): void {
        this.getRouter()?.getRoute("abaptofs")?.attachPatternMatched(this._onMatched, this);
    }

    private _onMatched(){
        
    }
}