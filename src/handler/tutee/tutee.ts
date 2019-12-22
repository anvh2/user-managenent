import { Request, Response, NextFunction } from "express";
import {
  IContractDB,
  ContractDB,
  ContractModel,
  ContractStatus
} from "../../plugins/database/contract/contract";
import TutorDB, { ITutorDB } from "../../plugins/database/tutor/tutor";
import { SSE } from "../../plugins/sse/sse";
import {
  NotifyModel,
  GetContractDescription,
  ContractTopic,
  RateTopic,
  GetRateDescription
} from "../../plugins/sse/notification";
import UserDB, { IUserDB, UserModel } from "../../plugins/database/user/user";
import { resolve } from "dns";

const Pagination = 12;

export interface ITuteeHandler {
  rentTutor(req: Request, res: Response): void;
  getListContractHistory(req: Request, res: Response): void;
  getDetailContractHistory(req: Request, res: Response): void;
  evaluateRateForTutor(req: Request, res: Response): void;
  evaluateCommentForTutor(req: Request, res: Response): void;
  payContract(req: Request, res: Response): void;
  complainContract(req: Request, res: Response): void;
}

export class TuteeHandler implements ITuteeHandler {
  contractDB: IContractDB;
  tutorDB: ITutorDB;
  userDB: IUserDB;

  constructor() {
    this.contractDB = new ContractDB();
    this.tutorDB = new TutorDB();
    this.userDB = new UserDB();
  }

  rentTutor(req: Request, res: Response) {
    var payload = res.locals.payload;
    if (!payload) {
      return res.json({
        code: -1,
        message: "User payload is undefined"
      });
    }
    var startTime = ~~(Date.parse(req.body.startTime) / 1000);
    if (!startTime) {
      return res.json({
        code: -1,
        message: "Format start time is not correct"
      });
    }
    var tutorID = Number(req.body.tutorID);
    var tutorUsername = req.body.tutor;
    var rentTime = Number(req.body.rentTime);
    var rentPrice = Number(req.body.rentPrice);
    if (tutorID < 0 || rentTime < 0 || rentPrice < 0) {
      return res.json({
        code: -1,
        message: "Some fields is incorrect"
      });
    }
    var entity = {
      tutor_id: tutorID,
      tutee_id: payload.id,
      desc: req.body.description,
      start_time: startTime,
      rent_time: rentTime,
      rent_price: rentPrice,
      create_time: ~~(Date.now() / 1000),
      status: ContractStatus.Pending
    } as ContractModel;
    if (!entity) {
      return res.json({
        code: -1,
        message: "Some fields is not correct"
      });
    }
    this.contractDB.setContract(entity, (err: Error, data: any) => {
      if (err) {
        return res.json({
          code: -1,
          message: err.toString()
        });
      }
      // notify to tutor
      // TODO: convert to async
      this.userDB.getByID(payload.id, (err: Error, data: any) => {
        if (err) {
          console.log("[TuteeHandler][rentTutor][err]", err);
          return;
        }
        var tutee = data[0] as UserModel;
        if (!tutee) {
          console.log(
            "[TuteeHandler][rentTutor][notify][err] Data is not user model"
          );
          return;
        }
        var contractID = data[0].id;
        if (!contractID) {
          console.log(
            "[TuteeHandler][rentTutor][notify[err] ContractID is not found"
          );
          return;
        }
        if (!tutee.name) {
          console.log(
            "[TuteeHandler][rentTutor][notify[err] Tutee name invalid"
          );
          return;
        }
        var notification = {
          contractID: contractID,
          topic: ContractTopic,
          description: GetContractDescription(tutee.name)
        } as NotifyModel;
        SSE.SendMessage(tutorUsername, notification);
      });
      return res.status(200).json({
        code: 1,
        meesage: "OK"
      });
    });
  }

  getListContractHistory(req: Request, res: Response) {
    var payload = res.locals.payload;
    if (!payload) {
      return res.json({
        code: -1,
        message: "User payload is invalid"
      });
    }
    var page = Number(req.params.page);
    var limit = Number(req.params.limit);
    if (page < 0 || limit < 0) {
      return res.json({
        code: -1,
        message: "Offset or limit is incorrect"
      });
    }
    var offset = page * Pagination;
    this.contractDB.getListContract(
      payload.id,
      payload.role,
      offset,
      limit,
      (err: Error, data: any) => {
        if (err) {
          return res.json({
            code: -1,
            message: err.toString()
          });
        }
        return res.status(200).json({
          code: 1,
          message: "OK",
          data
        });
      }
    );
  }

  getDetailContractHistory(req: Request, res: Response) {
    var contractID = Number(req.params.contractID);
    if (contractID < 0) {
      return res.json({
        code: -1,
        message: "Contract ID is incorrect"
      });
    }
    this.contractDB.getContract(contractID, (err: Error, data: any) => {
      if (err) {
        return res.json({
          code: -1,
          message: err.toString()
        });
      }
      return res.status(200).json({
        code: 1,
        message: "OK",
        data: data[0]
      });
    });
  }

  evaluateRateForTutor(req: Request, res: Response) {
    var stars = Number(req.body.stars);
    if (stars < 0 || stars > 5) {
      return res.json({
        code: -1,
        message: "Stars is incorrect"
      });
    }
    var contractID = Number(req.params.contractID);
    if (contractID < 0) {
      return res.json({
        code: -1,
        message: "Contract ID is incorrect"
      });
    }
    this.contractDB.getContract(contractID, (err: Error, data: any) => {
      if (err) {
        return res.json({
          code: -1,
          message: "Get contract is incorrect"
        });
      }
      var contract = data[0] as ContractModel;
      console.log("[Tutee][evaluateContract][contract]", contract);
      if (!contract) {
        return res.json({
          code: -1,
          message: "Contract model in database is incorrect"
        });
      }
      if (!contract.tutor_id) {
        return res.json({
          code: -1,
          message: "Tutor ID is empty"
        });
      }
      var payload = res.locals.payload;
      if (!payload) {
        return res.json({
          code: -1,
          message: "User payload is invalid"
        });
      }
      if (contract.tutee_id != payload.id) {
        return res.json({
          code: -1,
          message: "Permission denied"
        });
      }
      if (contract.status != ContractStatus.Finished) {
        return res.json({
          code: -1,
          message: "Contract is not finished"
        });
      }
      console.log("[Tutee][evaluateContract][stars]", contract.stars);
      if (contract.stars != null) {
        return res.json({
          code: -1,
          message: "Contract is evaluated"
        });
      }
      var entity = {
        id: contractID,
        stars: stars
      };
      this.contractDB.updateContract(entity, (err: Error, data: any) => {
        if (err) {
          return res.json({
            code: -1,
            message: "Update stars to database failed"
          });
        }
        if (contract.tutor_id) {
          this.tutorDB.updateRate(
            contract.tutor_id,
            stars,
            (err: Error, data: any) => {
              if (err) {
                return res.json({
                  code: -1,
                  message: err.toString()
                });
              }
              // notify to tutor
              var handle = function() {
                return new Promise(resolve => {
                  var notification = {
                    contractID: contract.id,
                    topic: RateTopic,
                    description: GetRateDescription("")
                  } as NotifyModel;
                  SSE.SendMessage("", entity);
                });
              };
              var notify = async function() {
                console.log(
                  "[TuteeHandler][evaluateRateForTutor] start notify"
                );
                var result = await handle();
                console.log(
                  "[TuteeHandler][evaluateRateForTutor] finish notify"
                );
              };
              notify();

              return res.status(200).json({
                code: 1,
                message: "OK"
              });
            }
          );
        }
      });
    });
  }

  evaluateCommentForTutor(req: Request, res: Response) {
    var comment = req.body.comment;
    if (!comment) {
      return res.json({
        code: -1,
        message: "Comment is empty"
      });
    }
    var contractID = Number(req.params.contractID);
    if (contractID < 0) {
      return res.json({
        code: -1,
        message: "Contract ID is incorrect"
      });
    }
    this.contractDB.getContract(contractID, (err: Error, data: any) => {
      if (err) {
        return res.json({
          code: -1,
          message: "Get contract is incorrect"
        });
      }
      var contract = data[0] as ContractModel;
      if (!contract) {
        return res.json({
          code: -1,
          message: "Contract model in database is incorrect"
        });
      }
      if (!contract.tutor_id) {
        return res.json({
          code: -1,
          message: "Tutor ID is empty"
        });
      }
      var payload = res.locals.payload;
      if (!payload) {
        return res.json({
          code: -1,
          message: "User payload is invalid"
        });
      }
      if (contract.tutee_id != payload.id) {
        return res.json({
          code: -1,
          message: "Permission denied"
        });
      }
      if (contract.status != ContractStatus.Finished) {
        return res.json({
          code: -1,
          message: "Contract is not finished"
        });
      }
      console.log("[Tutee][evaluateCommentContract][data]", contract.comment);
      if (contract.comment != null) {
        return res.json({
          code: -1,
          message: "Contract is evaluated"
        });
      }
      var entity = {
        id: contractID,
        comment: comment
      };
      this.contractDB.updateContract(entity, (err: Error, data: any) => {
        if (err) {
          return res.json({
            code: -1,
            message: "Update stars to database failed"
          });
        }
        // TODO: notify to tutor
        return res.status(200).json({
          code: 1,
          message: "OK"
        });
      });
    });
  }

  payContract(req: Request, res: Response) {
    var contractID = Number(req.params.contractID);
    if (contractID < 0) {
      return res.json({
        code: -1,
        message: "ContractID is invalid"
      });
    }
    this.contractDB.getContract(contractID, (err: Error, data: any) => {
      if (err) {
        return res.json({
          code: -1,
          message: "Get contract failed"
        });
      }
      var contract = data[0] as ContractModel;
      if (!contract) {
        return res.json({
          code: -1,
          message: "Contract model is incorrect"
        });
      }
      var payload = res.locals.payload;
      if (!payload) {
        return res.json({
          code: -1,
          message: "User payload is incorrect"
        });
      }
      if (contract.tutee_id != payload.id) {
        return res.json({
          code: 1,
          message: "Permission denied"
        });
      }
      if (contract.status != ContractStatus.Approved) {
        return res.json({
          code: -1,
          message: "Contract is not approved"
        });
      }
      // check amount and pay if ok
      var entity = {
        id: contract.id,
        status: ContractStatus.Paid
      } as ContractModel;
      this.contractDB.updateContract(entity, (err: Error, data: any) => {
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
    });
  }

  complainContract(req: Request, res: Response) {
    this.evaluateCommentForTutor(req, res);
  }
}
