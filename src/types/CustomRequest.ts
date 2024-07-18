import type {Request} from "express";

export interface CustomRequest extends Request {
    _id?: string;
}