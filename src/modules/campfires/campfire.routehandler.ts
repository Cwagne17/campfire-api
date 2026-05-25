import { Router } from "express";

import { asyncHandler } from "../../middleware/async-handler.middleware";
import { auth } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/request-validation.middleware";
import { validateResponse } from "../../middleware/response-validation";
import { ParkRole } from "../../types/auth";
import { CampfireService, type ICampfireService } from "./campfire.service";
import {
  CampfireListResponseSchema,
  CampfireParamsSchema,
  CampfireResponseSchema,
  CreateCampfireRequestSchema,
  DeleteCampfireResponseSchema,
  ListCampfiresQuerySchema,
  LogMutationRequestSchema,
  UpdateCampfireRequestSchema,
  type CampfireParams,
  type CreateCampfireRequest,
  type ListCampfiresQuery,
  type LogMutationRequest,
  type UpdateCampfireRequest,
} from "./campfire.types";

export class CampfireRouteHandler {
  constructor(private readonly campfireService: ICampfireService) {}

  public static build(service: ICampfireService = CampfireService.build()): Router {
    return new CampfireRouteHandler(service).buildRouter();
  }

  public buildRouter(): Router {
    const router = Router();

    router.post(
      "/campfires",
      auth(ParkRole.LEAD_RANGER, ParkRole.PARK_ADMIN),
      validate({ body: CreateCampfireRequestSchema }),
      asyncHandler(async (req, res) => {
        const result = await this.campfireService.createCampfire(req.body as CreateCampfireRequest);
        res.status(201).json(validateResponse(CampfireResponseSchema, result));
      }),
    );

    router.get(
      "/campfires",
      auth(),
      validate({ query: ListCampfiresQuerySchema }),
      asyncHandler(async (req, res) => {
        const result = await this.campfireService.listCampfires(
          req.query as unknown as ListCampfiresQuery,
        );
        res.status(200).json(validateResponse(CampfireListResponseSchema, result));
      }),
    );

    router.get(
      "/campfires/:campfireId",
      auth(),
      validate({ params: CampfireParamsSchema }),
      asyncHandler(async (req, res) => {
        const { campfireId } = req.params as CampfireParams;
        const result = await this.campfireService.getCampfire(campfireId);
        res.status(200).json(validateResponse(CampfireResponseSchema, result));
      }),
    );

    router.patch(
      "/campfires/:campfireId",
      auth(ParkRole.LEAD_RANGER, ParkRole.PARK_ADMIN),
      validate({
        params: CampfireParamsSchema,
        body: UpdateCampfireRequestSchema,
      }),
      asyncHandler(async (req, res) => {
        const { campfireId } = req.params as CampfireParams;
        const result = await this.campfireService.updateCampfire(
          campfireId,
          req.body as UpdateCampfireRequest,
        );
        res.status(200).json(validateResponse(CampfireResponseSchema, result));
      }),
    );

    router.delete(
      "/campfires/:campfireId",
      auth(ParkRole.PARK_ADMIN),
      validate({ params: CampfireParamsSchema }),
      asyncHandler(async (req, res) => {
        const { campfireId } = req.params as CampfireParams;
        const result = await this.campfireService.deleteCampfire(campfireId);
        res.status(200).json(validateResponse(DeleteCampfireResponseSchema, result));
      }),
    );

    router.post(
      "/campfires/:campfireId/logs",
      auth(ParkRole.RANGER, ParkRole.LEAD_RANGER, ParkRole.PARK_ADMIN),
      validate({
        params: CampfireParamsSchema,
        body: LogMutationRequestSchema,
      }),
      asyncHandler(async (req, res) => {
        const { campfireId } = req.params as CampfireParams;
        const result = await this.campfireService.addLogs(
          campfireId,
          req.body as LogMutationRequest,
        );
        res.status(200).json(validateResponse(CampfireResponseSchema, result));
      }),
    );

    router.delete(
      "/campfires/:campfireId/logs",
      auth(ParkRole.RANGER, ParkRole.LEAD_RANGER, ParkRole.PARK_ADMIN),
      validate({
        params: CampfireParamsSchema,
        body: LogMutationRequestSchema,
      }),
      asyncHandler(async (req, res) => {
        const { campfireId } = req.params as CampfireParams;
        const result = await this.campfireService.removeLogs(
          campfireId,
          req.body as LogMutationRequest,
        );
        res.status(200).json(validateResponse(CampfireResponseSchema, result));
      }),
    );

    router.post(
      "/campfires/:campfireId/ignite",
      auth(ParkRole.LEAD_RANGER, ParkRole.PARK_ADMIN),
      validate({ params: CampfireParamsSchema }),
      asyncHandler(async (req, res) => {
        const { campfireId } = req.params as CampfireParams;
        const result = await this.campfireService.igniteCampfire(campfireId);
        res.status(200).json(validateResponse(CampfireResponseSchema, result));
      }),
    );

    router.post(
      "/campfires/:campfireId/extinguish",
      auth(ParkRole.LEAD_RANGER, ParkRole.PARK_ADMIN),
      validate({ params: CampfireParamsSchema }),
      asyncHandler(async (req, res) => {
        const { campfireId } = req.params as CampfireParams;
        const result = await this.campfireService.extinguishCampfire(campfireId);
        res.status(200).json(validateResponse(CampfireResponseSchema, result));
      }),
    );

    return router;
  }
}
