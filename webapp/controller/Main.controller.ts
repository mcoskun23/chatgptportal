import BaseController from "./BaseController";

/**
 * @namespace com.ntt.chatgptportal.controller
 */
export default class Main extends BaseController {

    /*eslint-disable @typescript-eslint/no-empty-function*/
    public onInit(): void {

    }

    private onPressFsToAbap() {
        this.getRouter().navTo("fstoabap");
    }

    private onPressAbapToFs() {
        this.getRouter().navTo("abaptofs");
    }
}