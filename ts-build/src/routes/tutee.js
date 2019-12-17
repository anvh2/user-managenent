"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var authen_1 = __importDefault(require("../plugins/middlewares/authen"));
var tutee_1 = require("../handler/tutee/tutee");
/**
 * / route
 *
 * @class User
 */
var TuteeRoute = /** @class */ (function () {
    function TuteeRoute() {
        this.handler = new tutee_1.TuteeHandler();
    }
    /**
     * Create the routes.
     *
     * @class UserRoute
     * @method create
     * @static
     */
    TuteeRoute.prototype.create = function (router) {
        var _this = this;
        router.post("/renttutor", function (req, res, next) {
            authen_1.default.forTutee(req, res, next);
        }, function (req, res) {
            _this.handler.rentTutor(req, res);
        });
        router.get("/getcontracthistory/offset/:offset/limit/:limit", function (req, res, next) {
            authen_1.default.forTutee(req, res, next);
        }, function (req, res) {
            _this.handler.getListContractHistory(req, res);
        });
        router.get("/getcontract/:contractID", function (req, res, next) {
            authen_1.default.forTutee(req, res, next);
        }, function (req, res) {
            _this.handler.getDetailContractHistory(req, res);
        });
        router.post("/evaluaterate/:contractID", function (req, res, next) {
            authen_1.default.forTutee(req, res, next);
        }, function (req, res) {
            _this.handler.evaluateRateForTutor(req, res);
        });
        router.post("/evaluatecomment/:contractID", function (req, res, next) {
            authen_1.default.forTutee(req, res, next);
        }, function (req, res) {
            _this.handler.evaluateCommentForTutor(req, res);
        });
        router.post("/paycontract/:contractID", function (req, res, next) {
            authen_1.default.forTutee(req, res, next);
        }, function (req, res) {
            _this.handler.payContract(req, res);
        });
        router.post("/complaincontract/:contractID", function (req, res, next) {
            authen_1.default.forTutee(req, res, next);
        }, function (req, res) {
            _this.handler.complainContract(req, res);
        });
    };
    return TuteeRoute;
}());
exports.TuteeRoute = TuteeRoute;
