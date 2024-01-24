import BaseController from "./BaseController";

/**
 * @namespace com.ntt.chatgptportal.controller
 */
export default class Main extends BaseController {

    /*eslint-disable @typescript-eslint/no-empty-function*/
    public onInit(): void {

    }

    private onPressCreate() {
        const router = this.getRouter();

        router.navTo("create");
    }
}