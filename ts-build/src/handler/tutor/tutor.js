"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var tutor_1 = __importDefault(require("../../plugins/database/tutor/tutor"));
var TutorHandler = /** @class */ (function () {
    function TutorHandler() {
        this.tutorDB = new tutor_1.default();
    }
    TutorHandler.prototype.updateSkills = function (req, res) {
        var skills = req.body.skills;
        if (!skills) {
            return res.json({
                code: -1,
                message: "Field skills is incorrect"
            });
        }
        var payload = res.locals.payload;
        this.tutorDB.updateSkills(payload.id, skills, function (err, data) {
            if (err) {
                return res.json({
                    code: -1,
                    message: err.toString()
                });
            }
            return res.status(200).json({
                code: 1,
                message: "OK"
            });
        });
    };
    TutorHandler.prototype.getListTutors = function (req, res) {
        var offset = Number(req.params.offset);
        var limit = Number(req.params.limit);
        if (offset < 0 || limit < 0) {
            return res.json({
                code: -1,
                message: "Offset or limit is incorrect"
            });
        }
        this.tutorDB.getList(offset, limit, function (err, data) {
            if (err) {
                return res.json({
                    code: -1,
                    message: err.toString()
                });
            }
            return res.status(200).json({
                code: 1,
                message: "OK",
                data: data
            });
        });
    };
    TutorHandler.prototype.updateIntro = function (req, res) {
        var desc = req.body.introDesc;
        if (!desc) {
            return res.json({
                code: -1,
                message: "Empty description"
            });
        }
        var payload = res.locals.payload;
        this.tutorDB.updateIntro(payload.id, desc, function (err, data) {
            if (err) {
                return res.json({
                    code: -1,
                    message: err.toString()
                });
            }
            return res.status(200).json({
                code: 1,
                message: "OK"
            });
        });
    };
    TutorHandler.prototype.getProfile = function (req, res) {
        var tutorID = Number(req.params.tutorID);
        if (!tutorID) {
            return res.json({
                code: -1,
                message: "Empty tutorID"
            });
        }
        this.tutorDB.getProfile(tutorID, function (err, data) {
            if (err) {
                return res.json({
                    code: -1,
                    message: err.toString()
                });
            }
            return res.status(200).json({
                code: 1,
                message: "OK",
                data: data
            });
        });
    };
    TutorHandler.prototype.filterTutor = function (req, res) {
        var offset = Number(req.params.offset);
        var limit = Number(req.params.limit);
        if (offset < 0 || limit < 0) {
            return res.json({
                code: -1,
                message: "Offset or limit is incorrect"
            });
        }
        var district = req.body.district;
        var minPrice = req.body.minPrice;
        var maxPrice = req.body.maxPrice;
        var skill = req.body.skill;
        this.tutorDB.filterTutor(district, minPrice, maxPrice, skill, offset, limit, function (err, data) {
            if (err) {
                return res.json({
                    code: -1,
                    message: err.toString()
                });
            }
            return res.status(200).json({
                code: 1,
                message: "OK",
                data: data
            });
        });
    };
    TutorHandler.prototype.getListHistory = function (req, res) { };
    TutorHandler.prototype.chat = function (req, res) { };
    TutorHandler.prototype.renevueStatics = function (req, res) { };
    return TutorHandler;
}());
exports.TutorHandler = TutorHandler;